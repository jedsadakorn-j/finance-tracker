// Multi-user session auth.
//
// On login/register we issue a signed cookie `session=<payload>.<hmac>` where
// payload = base64url(JSON {userId, exp}). The HMAC (keyed with SESSION_SECRET)
// makes it tamper-proof, so we trust the userId inside without any server-side
// session store (stateless = free + simple). requireAuth verifies the cookie
// and stashes the userId on the context for downstream handlers.

import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { base64urlEncode, base64urlDecode, timingSafeEqual } from "./crypto";
import type { AppEnv } from "./index";

const COOKIE_NAME = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  userId: string;
  exp: number; // epoch ms
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64urlEncode(new Uint8Array(sig));
}

async function createToken(userId: string, secret: string): Promise<string> {
  const payload: SessionPayload = { userId, exp: Date.now() + SESSION_TTL_MS };
  const body = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  return `${body}.${await hmac(body, secret)}`;
}

async function verifyToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!timingSafeEqual(sig, await hmac(body, secret))) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(body)),
    ) as SessionPayload;
    if (typeof payload.userId !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp <= Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}

export async function issueSession(
  c: Context<AppEnv>,
  userId: string,
): Promise<void> {
  const token = await createToken(userId, c.env.SESSION_SECRET);
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

// Returns the userId of the current session, or null.
export async function currentUserId(c: Context<AppEnv>): Promise<string | null> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  const payload = await verifyToken(token, c.env.SESSION_SECRET);
  return payload?.userId ?? null;
}

// Middleware: reject unauthenticated requests, else stash userId on context.
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const userId = await currentUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  c.set("userId", userId);
  await next();
};
