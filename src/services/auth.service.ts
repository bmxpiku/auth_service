import { UnauthorizedError } from "../errors/domain/UnauthorizedError.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { normalizeEmail } from "../lib/email.js";
import { verifyPassword } from "../lib/password.js";

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
    const DUMMY_PASSWORD_HASH =
      "$argon2id$v=19$m=65536,p=4,t=3$SE49KmZi05UqTbGBInDkwQ$/6RmSwpzmwD5KXBJNtaThXlmyOVQJEWVc4whaeHxCsc"; // Precomputed hash for a dummy password

    await verifyPassword(DUMMY_PASSWORD_HASH, password); // Perform dummy verification to mitigate timing attacks
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return { id: user.id, email: user.email };
}
