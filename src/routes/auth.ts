import type { FastifyInstance } from "fastify";
import { NotFoundError } from "../errors/domain/NotFoundError.js";
import { authGuard, requireUser } from "../lib/authGuard.js";
import { signAccessToken } from "../lib/jwt.js";
import {
  type LoginBody,
  type LoginReply200,
  loginBodySchema,
  loginReply200Schema,
  type MeReply200,
  meReply200Schema,
} from "../schemas/auth.js";
import { type ErrorReply, errorReplySchema } from "../schemas/common.js";
import { authenticateUser } from "../services/auth.service.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post<{
    Body: LoginBody;
    Reply: { 200: LoginReply200; 400: ErrorReply; 401: ErrorReply };
  }>(
    "/auth/login",
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: loginReply200Schema,
          400: errorReplySchema,
          401: errorReplySchema,
        },
      },
    },
    async (request, reply) => {
      const user = await authenticateUser(request.server.db, request.body);

      const accessToken = await signAccessToken(user.id);
      return reply.status(200).send({ access_token: accessToken });
    },
  );

  app.get<{
    Reply: { 200: MeReply200; 401: ErrorReply };
  }>(
    "/auth/me",
    {
      preHandler: authGuard,
      schema: {
        response: {
          200: meReply200Schema,
          401: errorReplySchema,
        },
      },
    },
    async (request, reply) => {
      const user = await request.server.db.user.findUnique({
        where: { id: requireUser(request).id },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return reply.status(200).send({
        id: user.id,
        email: user.email,
      });
    },
  );
}
