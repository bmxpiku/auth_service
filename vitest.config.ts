import { defineConfig } from "vitest/config";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";

export default defineConfig({});





