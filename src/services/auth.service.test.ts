import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../errors/domain/UnauthorizedError.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword } from "../lib/password.js";
import { type AuthenticateUserInput, authenticateUser } from "./auth.service.js";

function createFakeDb(userRecord: null | Record<string, unknown>): PrismaClient {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(userRecord),
    },
  } as unknown as PrismaClient;
}

describe("AuthService", () => {
  it("throws UnauthorizedError when no user exists for the email", async () => {
    const fakeDb = createFakeDb(null);
    const userRecord: AuthenticateUserInput = {
      email: "dummy@email.com",
      password: "dummyPassword",
    };
    const promise = authenticateUser(fakeDb, userRecord);

    await expect(promise).rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when the user exists but the password is invalid", async () => {
    const userRecord: AuthenticateUserInput = {
      email: "dummy@email.com",
      password: "invalidPassword",
    };

    const fakeDb = createFakeDb({
      email: "dummy@email.com",
      passwordHash: await hashPassword("dummyPassword"),
    });

    const promise = authenticateUser(fakeDb, userRecord);

    await expect(promise).rejects.toThrow(UnauthorizedError);
  });

  it("produces an IDENTICAL error for 'no user' and 'invalid password' scenarios to avoid leaking information about which emails are registered", async () => {
    const fakeDBNoUser = createFakeDb(null);
    const fakeDBInvalidPassword = createFakeDb({
      email: "dummy@email.com",
      passwordHash: await hashPassword("dummyPassword"),
    });

    const userRecord: AuthenticateUserInput = {
      email: "dummy@email.com",
      password: "invalidPassword",
    };

    const errorNoUserPromise = authenticateUser(fakeDBNoUser, userRecord).catch((err) => err);
    const errorInvalidPasswordPromise = authenticateUser(fakeDBInvalidPassword, userRecord).catch((err) => err);

    const errorNoUser = await errorNoUserPromise;
    const errorInvalidPassword = await errorInvalidPasswordPromise;

    expect(errorNoUser).toBeInstanceOf(UnauthorizedError);
    expect(errorInvalidPassword).toBeInstanceOf(UnauthorizedError);
    expect(errorNoUser.message).toEqual(errorInvalidPassword.message);
  });

  it("return only { id, email } on success, no password or other sensitive information should be returned", async () => {
    const userRecord: AuthenticateUserInput = {
      email: "dummy@email.com",
      password: "dummyPassword",
    };

    const fakeDb = createFakeDb({
      email: userRecord.email,
      passwordHash: await hashPassword(userRecord.password),
      id: "user-id-123",
    });

    const result = await authenticateUser(fakeDb, userRecord);
    expect(result).toEqual({ id: "user-id-123", email: userRecord.email });
  });
});
