import argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { getDb } from "../lib/db.js";
import { normalizeEmail } from "../lib/email.js";
import { withPrismaError } from "../lib/prismaErrors.js";
// import {constants} from "node:http2"
// TODO: kody błędów HTTP w jednym miejscu, np. w pliku constants.ts
// TODO: add schema for users

export default async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.post("/users", async (request, reply) => {
    const { email: rawEmail, password } = request.body as { email: string; password: string };

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
      // passwordHash intentionally omitted
    });
  });
}
