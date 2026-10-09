import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32; // 256 bits of entropy — same reasoning as a JWT signing key
const ENCODING = "base64url"; // safe to put in a cookie, no padding chars, no + / like base64 has

export function generateOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString(ENCODING);
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest(ENCODING);
}
