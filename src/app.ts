import fastify, { type FastifyInstance } from "fastify";

export function createApp(): FastifyInstance {
  const app = fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  app.get("/healthcheck", async (_request, reply) => {
    return reply.type("text/plain").send("OK");
  });

  return app;
}
