import { afterAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("GET /healthcheck", () => {
  const app = createApp();

  afterAll(async () => {
    await app.close();
  });

  it("reports that the service is healthy", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/healthcheck",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.body).toBe("OK");
  });
});
