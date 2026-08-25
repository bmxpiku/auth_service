import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { loadConfig } from "../../src/config/configLoader";
import { resetTestDatabase } from "../clearDb";

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
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: {
        email: "piotr@gmail.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.email).toBe("piotr@gmail.com");
    expect(body.password).toBeUndefined();
  });

  it("does not allow two users with the same email", async () => {
    const payload = { email: "piotr@gmail.com", password: "password123" };
    await app.inject({ method: "POST", url: "/users", body: payload });
    const response = await app.inject({ method: "POST", url: "/users", body: payload });

    expect(response.statusCode).toBe(409);
    expect(response.json().error).toBe("CONFLICT");
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
