// Stateless, single-user session auth.
//
// Login: client POSTs the password. If it matches ADMIN_PASSWORD we issue a
// signed cookie `session=<payload>.<hmac>`. The payload carries an expiry, the
// HMAC (keyed with SESSION_SECRET) makes it tamper-proof — so we can verify a
// session without any server-side storage (no KV, no DB row = free + simple).
//
// When we add multi-user later, the cookie payload gains a userId and the
// query layer filters on it; the signing/verifying primitives below stay.

import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv } from "./index";

const COOKIE_NAME = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// ---- low-level base64url + HMAC helpers (Web Crypto, no deps) ----

function base64urlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64urlEncode(new Uint8Array(sig));
}

// Constant-time-ish comparison to avoid leaking timing on the MAC.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---- session token ----

interface SessionPayload {
  exp: number; // epoch ms
}

async function createToken(secret: string): Promise<string> {
  const payload: SessionPayload = { exp: Date.now() + SESSION_TTL_MS };
  const body = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const sig = await sign(body, secret);
  return `${body}.${sig}`;
}

async function verifyToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = await sign(body, secret);
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const payload: SessionPayload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(body)),
    );
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Compare submitted password to ADMIN_PASSWORD in constant time.
export function checkPassword(input: string, expected: string): boolean {
  if (!expected) return false;
  return timingSafeEqual(input, expected);
}

export async function issueSession(c: Context<AppEnv>): Promise<void> {
  const token = await createToken(c.env.SESSION_SECRET);
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSession(c: Context<AppEnv>): void {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

export async function isAuthenticated(c: Context<AppEnv>): Promise<boolean> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return false;
  return verifyToken(token, c.env.SESSION_SECRET);
}

// Middleware: reject unauthenticated requests with 401.
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!(await isAuthenticated(c))) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
