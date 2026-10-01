import { JWSSignatureVerificationFailed, JWTExpired } from "jose/errors";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeSegment, signAccessToken, splitToken, verifyAccessToken } from "./jwt.js";

describe("access tokens", () => {
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

  it("rejects an expired token", async () => {
    const token = await signAccessToken("test-user-id");

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 16 * 60 * 1000); // 16 minutes later

    await expect(verifyAccessToken(token)).rejects.toThrow(JWTExpired);
  });
});
