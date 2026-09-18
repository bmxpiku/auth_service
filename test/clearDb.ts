import type { FastifyInstance } from "fastify";

export async function resetTestDatabase(app: FastifyInstance) {
  const { NODE_ENV, DATABASE_URL } = app.config;

  if (NODE_ENV !== "test") {
    throw new Error("resetTestDatabase should only be called in test environment");
  }

  if (!new URL(DATABASE_URL).pathname.toLowerCase().includes("test")) {
    throw new Error("resetTestDatabase should only be called with test database");
  }

  await app.db.user.deleteMany({});
}
