import { JWSSignatureVerificationFailed, JWTClaimValidationFailed, JWTExpired } from "jose/errors";
import { describe, expect, it } from "vitest";
import {
  AUDIENCE,
  decodeSegment,
  generateRsaKeyPair,
  ISSUER,
  signDemoToken,
  splitToken,
  verifyDemoToken,
} from "./jwt.js";

describe("JWT", () => {
  it("creates a token whose header and payload are readable without a key, and verifies successfully with the correct key/issuer/audience", async () => {
    const { privateKey, publicKey } = await generateRsaKeyPair();
    const token = await signDemoToken(privateKey, { sub: "user-123" });

    // Split & decode without ever touching a key
    const [headerB64, payloadB64] = splitToken(token);
    const decodedHeader = decodeSegment(headerB64) as Record<string, unknown>;
    const decodedPayload = decodeSegment(payloadB64) as Record<string, unknown>;

    expect(decodedHeader).toEqual({ alg: "RS256", typ: "JWT" });
    expect(decodedPayload).toMatchObject({
      sub: "user-123",
      iss: ISSUER,
      aud: AUDIENCE,
    });
    expect(decodedPayload.iat).toEqual(expect.any(Number));
    expect(decodedPayload.exp).toEqual(expect.any(Number));

    // Now actually verify with the public key
    const { payload, protectedHeader } = await verifyDemoToken(token, publicKey);
    expect(protectedHeader).toEqual({ alg: "RS256", typ: "JWT" });
    expect(payload.sub).toBe("user-123");
    expect(payload.iss).toBe(ISSUER);
    expect(payload.aud).toBe(AUDIENCE);
  });

  // Tampered payload
  it("rejects a token with a tampered payload", async () => {
    const { privateKey, publicKey } = await generateRsaKeyPair();
    const token = await signDemoToken(privateKey);

    const [headerB64, payloadB64, signatureB64] = splitToken(token);
    const payload = decodeSegment(payloadB64) as Record<string, unknown>;
    const tamperedPayload = { ...payload, sub: "attacker-999" };
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString("base64url");

    const tamperedToken = `${headerB64}.${tamperedPayloadB64}.${signatureB64}`;

    await expect(verifyDemoToken(tamperedToken, publicKey)).rejects.toBeInstanceOf(JWSSignatureVerificationFailed);
  });

  // Wrong key pair
  it("rejects a token verified with a different key pair's public key", async () => {
    const { privateKey } = await generateRsaKeyPair();
    const { publicKey: unrelatedPublicKey } = await generateRsaKeyPair(); // second, unrelated pair

    const token = await signDemoToken(privateKey);

    await expect(verifyDemoToken(token, unrelatedPublicKey)).rejects.toBeInstanceOf(JWSSignatureVerificationFailed);
  });

  // Wrong issuer
  it("rejects a token when the issuer doesn't match", async () => {
    const { privateKey, publicKey } = await generateRsaKeyPair();
    const token = await signDemoToken(privateKey);

    const { jwtVerify } = await import("jose");
    await expect(
      jwtVerify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: "some-other-service", // wrong on purpose
        audience: AUDIENCE,
      }),
    ).rejects.toBeInstanceOf(JWTClaimValidationFailed);
  });

  // Wrong audience
  it("rejects a token when the audience doesn't match", async () => {
    const { privateKey, publicKey } = await generateRsaKeyPair();
    const token = await signDemoToken(privateKey);

    const { jwtVerify } = await import("jose");
    await expect(
      jwtVerify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: ISSUER,
        audience: "some-other-api", // wrong on purpose
      }),
    ).rejects.toBeInstanceOf(JWTClaimValidationFailed);
  });

  // Expired token
  it("rejects an expired token", async () => {
    const { privateKey, publicKey } = await generateRsaKeyPair();
    const token = await signDemoToken(privateKey, { expiresIn: "-1s" }); // already expired

    await expect(verifyDemoToken(token, publicKey)).rejects.toBeInstanceOf(JWTExpired);
  });
});
