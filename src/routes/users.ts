import type { FastifyInstance } from "fastify";
import { type ErrorReply, errorReplySchema } from "../schemas/common.js";
import {
  type CreateUserBody,
  type CreateUserReply201,
  createUserBodySchema,
  createUserReply201Schema,
} from "../schemas/users.js";
import { createUser } from "../services/users.service.js";

export default async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: CreateUserBody;
    Reply: { 201: CreateUserReply201; 400: ErrorReply };
  }>(
    "/users",
    {
      schema: {
        body: createUserBodySchema,
        response: {
          201: createUserReply201Schema,
          400: errorReplySchema,
        },
      },
    },
    async (request, reply) => {
      const user = await createUser(request.server.db, request.body);

      return reply.status(201).send({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      });
    },
  );
}
