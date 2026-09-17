import type { PrismaClient } from "../generated/prisma/client.js";
import { normalizeEmail } from "../lib/email.js";
import { hashPassword } from "../lib/password.js";
import { withPrismaError } from "../lib/prismaErrors.js";

export interface CreateUserInput {
  email: string;
  password: string;
}

export async function createUser(db: PrismaClient, { email: rawEmail, password }: CreateUserInput) {
  const email = normalizeEmail(rawEmail);
  const passwordHash = await hashPassword(password);

  return withPrismaError(() => db.user.create({ data: { email, passwordHash } }), {
    operation: "create",
    model: "User",
  });
}
