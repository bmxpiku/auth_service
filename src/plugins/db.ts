import { PrismaPg } from "@prisma/adapter-pg";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "../generated/prisma/client.js";

export interface DbPluginOptions {
  connectionString: string;
}
export const dbPlugin = fp(async (app: FastifyInstance, { connectionString }: DbPluginOptions) => {
  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    await db.$disconnect();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
  }
}
