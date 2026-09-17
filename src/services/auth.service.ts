import type { PrismaClient } from "@prisma/client/extension";

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export async function authenticateUser(db: PrismaClient, { email, password }: AuthenticateUserInput) {}
