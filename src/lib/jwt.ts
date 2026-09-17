import { type CryptoKey, generateKeyPair, jwtVerify, SignJWT } from "jose";

export const ISSUER = "auth-service";
export const AUDIENCE = "users-api";

export async function generateRsaKeyPair() {
  return generateKeyPair("RS256");
}

export async function signDemoToken(privateKey: CryptoKey, options: { sub?: string; expiresIn?: string } = {}) {
  return new SignJWT()
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setSubject(options.sub ?? "demo-user")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(options.expiresIn ?? "10s")
    .sign(privateKey);
}

export function splitToken(token: string): [header: string, payload: string, signature: string] {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error(`Expected a 3-part JWT, got ${parts.length} parts`);
  }
  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) {
    throw new Error("JWT segment unexpectedly empty");
  }
  return [header, payload, signature];
}

export function decodeSegment(seg: string): unknown {
  const json = Buffer.from(seg, "base64url").toString("utf8");
  return JSON.parse(json);
}

export async function verifyDemoToken(token: string, publicKey: CryptoKey) {
  return jwtVerify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}
