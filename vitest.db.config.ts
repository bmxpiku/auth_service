import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://test_user:test_pass@localhost:5433/test_db",
      COOKIE_SECRET: "test-cookie-secret-at-least-32-characters-long",
    },
    include: ["test/integration/**/*.test.ts"],
    fileParallelism: false,
  },
});
