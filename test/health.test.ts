import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/configLoader.js";

describe("GET /healthcheck", () => {
  let app: FastifyInstance;

  beforeAll(() => {
    // loadConfig() must run before createApp() — getConfig() throws if not initialized
    loadConfig();
    app = createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("reports that the service is healthy", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/healthcheck",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.json()).toEqual({ status: "ok" });
  });
});
