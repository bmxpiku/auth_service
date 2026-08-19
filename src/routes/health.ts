import type { FastifyInstance } from "fastify";


const healthSchema = {
    response: {
         200: {
             type: "object",
             properties: {
                    status: { type: "string" },
             },
                required: ["status"]
         }
     }
} as const;


export default async function healthRoutes(app: FastifyInstance): Promise<void> {
    app.get("/healthcheck", { schema: healthSchema },  async (_request, reply) => {
        return reply.send({status: "ok"});
    });
}
