import argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { loadConfig } from "../../src/config/configLoader.js";
import { getDb } from "../../src/lib/db.js";
import { resetTestDatabase } from "../clearDb.js";

describe("POST /users", () => {
  let app: FastifyInstance;

  beforeAll(() => {
    loadConfig();
    app = createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("creates a user", async () => {
    const payload = { email: "piotr@gmail.com", password: "password123" };

    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: payload,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();

    // toEqual sprawdza dokładny kształt obiektu — dodatkowe pole (np. passwordHash)
    // wywaliłoby test, nawet gdybyśmy zapomnieli dopisać dla niego osobną asercję.
    expect(body).toEqual({
      id: expect.any(String),
      email: payload.email,
      createdAt: expect.any(String),
    });
    expect(body.password).toBeUndefined();
    expect(body.passwordHash).toBeUndefined();
  });

  it("stores a securely hashed password, never the plain text", async () => {
    const payload = { email: "piotr@gmail.com", password: "password123" };

    const response = await app.inject({ method: "POST", url: "/users", body: payload });
    const { id } = response.json();

    const user = await getDb().user.findUniqueOrThrow({ where: { id } });

    expect(user.passwordHash).not.toBe(payload.password);
    await expect(argon2.verify(user.passwordHash, payload.password)).resolves.toBe(true);
  });

  it("does not allow two users with the same email", async () => {
    const payload = { email: "piotr@gmail.com", password: "password123" };

    const first = await app.inject({ method: "POST", url: "/users", body: payload });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({ method: "POST", url: "/users", body: payload });
    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe("CONFLICT");
  });

  it("treats emails as case-insensitive for uniqueness", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/users",
      body: { email: "User@Example.com", password: "password123" },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/users",
      body: { email: "user@example.com", password: "password123" },
    });

    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe("CONFLICT");
  });

  it("returns 400 when email is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: { password: "password123" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("BAD_REQUEST");
  });

  it("returns 400 when email has invalid format", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: { email: "not-an-email", password: "password123" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("BAD_REQUEST");
  });

  it("returns 400 when password is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: { email: "piotr@gmail.com" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("BAD_REQUEST");
  });

  it("returns 400 when password is too short", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: { email: "piotr@gmail.com", password: "short" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("BAD_REQUEST");
  });

  it("returns 400 when password is too long", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: { email: "piotr@gmail.com", password: "a".repeat(73) },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("BAD_REQUEST");
  });

  it("returns 400 when unknown fields are present", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: { email: "piotr@gmail.com", password: "password123", role: "admin" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("BAD_REQUEST");
  });
});
