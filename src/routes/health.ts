import type { FastifyInstance } from "fastify";
import { type HealthReply200, healthReply200Schema } from "../schemas/health.js";

const healthSchema = {
  response: {
    200: healthReply200Schema,
  },
} as const;

export default async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Reply: { 200: HealthReply200 } }>("/healthcheck", { schema: healthSchema }, async (_request, reply) => {
    return reply.status(200).send({ status: "ok" });
  });
}
