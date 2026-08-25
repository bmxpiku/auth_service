import { defineConfig } from "vitest/config";

process.env.DATABASE_URL = "postgresql://test_user:test_pass@localhost:5433/test_db";

export default defineConfig({});





