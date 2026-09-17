import { type CryptoKey, type GenerateKeyPairResult, generateKeyPair, jwtVerify, SignJWT } from "jose";

export const ISSUER = "auth-service";
export const AUDIENCE = "users-api";
const ACCESS_TOKEN_EXPIRATION = "15m";
const ALGORITHM = "RS256";

let keyPairPromise: Promise<GenerateKeyPairResult> | null = null;

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

export async function generateRsaKeyPair(): Promise<GenerateKeyPairResult> {
  return generateKeyPair("RS256");
}

function getSigningKeyPair() {
  keyPairPromise ??= generateRsaKeyPair();

  return keyPairPromise;
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

export async function verifyDemoToken(token: string, publicKey: CryptoKey) {
  return jwtVerify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export async function signAccessToken(userId: string): Promise<string> {
  const { privateKey } = await getSigningKeyPair();

  return new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
    .sign(privateKey);
}

export async function verifyAccessToken(token: string): Promise<{ userId: string }> {
  const { publicKey } = await getSigningKeyPair();
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid token payload");
  }

  return { userId: payload.sub };
}
