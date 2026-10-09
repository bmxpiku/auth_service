import { SignJWT } from "jose";
import { JWSSignatureVerificationFailed, JWTClaimValidationFailed, JWTExpired } from "jose/errors";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../config/configLoader.js";
import {
  ALGORITHM,
  AUDIENCE,
  decodeSegment,
  getSigningKeyPair,
  ISSUER,
  signAccessToken,
  splitToken,
  verifyAccessToken,
} from "./jwt.js";

describe("access tokens", () => {
  beforeAll(() => {
    loadConfig();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips: signs a token for a userId and verifies it back to the same userId", async () => {
    const token = await signAccessToken("test-user-id");

    const result = await verifyAccessToken(token);

    expect(result).toEqual({ userId: "test-user-id" });
  });

  it("rejects a token with a tampered payload", async () => {
    const token = await signAccessToken("test-user-id");

    const [headerB64, payloadB64, signatureB64] = splitToken(token);

    const payload = decodeSegment(payloadB64) as Record<string, unknown>;

    const tamperedPayload = { ...payload, sub: "tampered-user-id" };
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString("base64url");

    const tamperedToken = `${headerB64}.${tamperedPayloadB64}.${signatureB64}`;

    await expect(verifyAccessToken(tamperedToken)).rejects.toThrow(JWSSignatureVerificationFailed);
  });

  it("rejects a token signed for a different issuer", async () => {
    const { privateKey } = await getSigningKeyPair();

    const tokenWithWrongIssuer = await new SignJWT()
      .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
      .setSubject("test-user-id")
      .setIssuer("some-other-issuer") // celowo błędny iss
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(privateKey);

    await expect(verifyAccessToken(tokenWithWrongIssuer)).rejects.toThrow(JWTClaimValidationFailed);
  });

  it("rejects a token signed for a different audience", async () => {
    const { privateKey } = await getSigningKeyPair();

    const tokenWithWrongAudience = await new SignJWT()
      .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
      .setSubject("test-user-id")
      .setIssuer(ISSUER)
      .setAudience("some-other-api") // celowo błędny aud
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(privateKey);

    await expect(verifyAccessToken(tokenWithWrongAudience)).rejects.toThrow(JWTClaimValidationFailed);
  });

  it("rejects a token that has no sub claim", async () => {
    const { privateKey } = await getSigningKeyPair();

    const tokenWithoutSub = await new SignJWT()
      .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
      // celowo bez .setSubject(...)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(privateKey);

    await expect(verifyAccessToken(tokenWithoutSub)).rejects.toThrow("Invalid token payload");
  });

  it("rejects an expired token", async () => {
    const token = await signAccessToken("test-user-id");

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 16 * 60 * 1000); // 16 minutes later

    await expect(verifyAccessToken(token)).rejects.toThrow(JWTExpired);
  });
});
