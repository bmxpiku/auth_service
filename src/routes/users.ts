import argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { getDb } from "../lib/db.js";
import { normalizeEmail } from "../lib/email.js";
import { withPrismaError } from "../lib/prismaErrors.js";
import {
  type CreateUserBody,
  createUserBodySchema,
  createUserReply201Schema,
  errorReplySchema,
} from "../schemas/users.js";

export default async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: CreateUserBody;
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
      const { email: rawEmail, password } = request.body;

      const email = normalizeEmail(rawEmail);
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

      const user = await withPrismaError(() =>
        getDb().user.create({
          data: { email, passwordHash },
        }),
      );

      return reply.status(201).send({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      });
    },
  );
}
