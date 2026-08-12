import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
    app.get("/healthcheck", async (_request, reply) => {
        return reply.type("text/plain").send("OK");
    });
}
