import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://test_user:test_pass@localhost:5433/test_db",
    },
    include: ["test/integration/**/*.test.ts"],
    fileParallelism: false,
  },
});
