import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config/configLoader";
import { getDb } from "../src/lib/db.js";

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
    // Clear the database before each test
    const db = getDb();
    await db.user.deleteMany({});
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

  it.todo("");
});
