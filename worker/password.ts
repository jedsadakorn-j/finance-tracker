// Password hashing with PBKDF2 (Web Crypto — available in Workers, no deps).
// Stored format:  pbkdf2$<iterations>$<saltB64url>$<hashB64url>
import { base64urlEncode, base64urlDecode, timingSafeEqual } from "./crypto";

const ITERATIONS = 100_000;
const KEY_BITS = 256; // 32-byte derived key

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveBits(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${base64urlEncode(salt)}$${base64urlEncode(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1) return false;
  const salt = base64urlDecode(parts[2]);
  const hash = await deriveBits(password, salt, iterations);
  return timingSafeEqual(base64urlEncode(hash), parts[3]);
}
