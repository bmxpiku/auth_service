/**
 * One-off CLI tool: generates a fresh RSA keypair for signing access tokens
 * and prints both halves in the shape you need:
 *
 *  - JWT_PRIVATE_KEY_BASE64 — paste into `.env` / your deploy secrets.
 *    Keep this one secret.
 *  - The public key PEM — not a secret, printed for debugging/reference
 *    (e.g. to verify a token independently, or to hand to another service
 *    that only needs to verify, not sign).
 *
 * Usage:
 *   npx tsx scripts/generate-jwt-key.ts
 */
import { exportPKCS8, exportSPKI, generateKeyPair } from "jose";

// Note: jwt.ts's own generateRsaKeyPair() deliberately produces
// non-extractable keys (fine for an ephemeral in-process key that's never
// exported). This script needs an extractable keypair so it can PEM-encode
// it, hence calling jose's generateKeyPair directly with that option.
const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });

const privatePem = await exportPKCS8(privateKey);
const publicPem = await exportSPKI(publicKey);
const privateBase64 = Buffer.from(privatePem, "utf8").toString("base64");

console.log("# PRIVATE — keep secret. Paste into .env / deploy secrets as:");
console.log(`JWT_PRIVATE_KEY_BASE64=${privateBase64}`);
console.log();
console.log("# PUBLIC — safe to share, printed for reference/debugging only:");
console.log(publicPem);



