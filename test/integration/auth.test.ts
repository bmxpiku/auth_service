import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { loadConfig } from "../../src/config/configLoader.js";
import { signAccessToken } from "../../src/lib/jwt";
import { resetTestDatabase } from "../clearDb.js";

describe("POST /auth/login and GET /auth/me", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = loadConfig();
    app = createApp(config);
    await app.ready();
    // Warm up the lazily-generated signing key pair so it doesn't
    // inflate whichever test happens to run first.
    await signAccessToken("warmup");
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetTestDatabase(app);
  });

  async function seedUser(email: string, password: string) {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      body: { email, password },
    });

    expect(response.statusCode).toBe(201);
  }

  describe("POST /auth/login", () => {
    it("returns 200 and an access_token for correct credentials", async () => {
      // Arrange: seed a user
      await seedUser("test@example.com", "password123");
      // Act: app.inject POST /auth/login with correct email/password
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: { email: "test@example.com", password: "password123" },
      });
      // Assert: statusCode 200, body has access_token as a string
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty("access_token");
      expect(typeof body.access_token).toBe("string");
    });

    it("returns 401 for a correct email but wrong password", async () => {
      // Arrange: seed a user
      await seedUser("test@example.com", "password123");
      // Act: POST /auth/login with wrong password
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: { email: "test@example.com", password: "wrongpassword" },
      });
      // Assert: statusCode 401, capture body
      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toBe("UNAUTHORIZED");
    });

    it("returns 401 for an email that doesn't exist", async () => {
      // Act: POST /auth/login with a never-registered email
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: { email: "nonexistent@example.com", password: "password123" },
      });
      // Assert: statusCode 401, capture body
      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toBe("UNAUTHORIZED");
    });

    it("produces an IDENTICAL response body for wrong-password and unknown-email cases", async () => {
      // Arrange: seed a user (for the wrong-password case)
      await seedUser("test@example.com", "password123");
      // Act: two separate app.inject calls (wrong password / unknown email)
      const wrongPasswordResponse = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: { email: "test@example.com", password: "wrongpassword" },
      });
      const unknownEmailResponse = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: { email: "nonexistent@example.com", password: "password123" },
      });
      // Assert: both responses have statusCode 401 AND identical .json() bodies
      expect(wrongPasswordResponse.statusCode).toBe(401);
      expect(unknownEmailResponse.statusCode).toBe(401);
      expect(wrongPasswordResponse.json()).toEqual(unknownEmailResponse.json());
    });

    it("returns 400 for a malformed request body", async () => {
      // e.g. missing email/password entirely — schema validation should catch this
      // before authenticateUser is ever called
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: {},
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /auth/me", () => {
    it("returns the authenticated user's id and email given a valid access_token", async () => {
      // Arrange: seed a user, log in via POST /auth/login to get a real access_token
      await seedUser("test@example.com", "password123");
      // Act: app.inject POST /auth/login to get a valid access_token
      const loginResponse = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: { email: "test@example.com", password: "password123" },
      });
      // Act: app.inject GET /auth/me with Authorization: Bearer <token>
      const response = await app.inject({
        method: "GET",
        url: "/auth/me",
        headers: {
          Authorization: `Bearer ${loginResponse.json().access_token}`, // Replace <token> with the actual token obtained from login
        },
      });
      // Assert: statusCode 200, body equals { id, email } EXACTLY
      //   (toEqual, not toMatchObject — same "no extra fields" principle as users.test.ts)
      expect(response.statusCode).toBe(200);
      // Assert: body has id and email, but no other fields
      expect(response.json()).toEqual({
        id: expect.any(String),
        email: "test@example.com",
      });
      // Assert: body.passwordHash is undefined (defense-in-depth, belt-and-suspenders)
      expect(response.json().passwordHash).toBeUndefined();
    });

    it("returns 401 when no Authorization header is present", async () => {
      // Act: app.inject GET /auth/me with NO headers at all
      const response = await app.inject({
        method: "GET",
        url: "/auth/me",
      });
      // Assert: statusCode 401
      expect(response.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is malformed or the token is garbage", async () => {
      // e.g. "Authorization: Bearer not-a-real-token" or missing "Bearer " prefix entirely
      const response = await app.inject({
        method: "GET",
        url: "/auth/me",
        headers: {
          Authorization: "Bearer not-a-real-token",
        },
      });
      // Assert: statusCode 401
      expect(response.statusCode).toBe(401);
    });
  });
});
