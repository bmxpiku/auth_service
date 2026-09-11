import { PrismaPg } from "@prisma/adapter-pg";
import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

export function registerDb(app: FastifyInstance, config: AppConfig) {
  const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });
  const db = new PrismaClient({ adapter });
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    await db.$disconnect();
  });
}

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
  }
}
