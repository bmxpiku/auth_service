import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8"
    },
    env: {
      DATABASE_URL: "postgresql://test_user:test_pass@localhost:5433/test_db",
    },
    exclude: ["test/integration/**", "node_modules/**"],
  },
});
