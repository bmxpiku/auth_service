import { UnauthorizedError } from "../errors/domain/UnauthorizedError.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { normalizeEmail } from "../lib/email.js";
import { verifyDummyPassword, verifyPassword } from "../lib/password.js";

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export async function authenticateUser(
  db: PrismaClient,
  { email: rawEmail, password }: AuthenticateUserInput,
): Promise<{ id: string; email: string }> {
  const email = normalizeEmail(rawEmail);
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    await verifyDummyPassword(password); // Perform dummy verification to mitigate timing attacks
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return { id: user.id, email: user.email };
}
