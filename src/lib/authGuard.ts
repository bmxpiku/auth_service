import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../errors/domain/UnauthorizedError.js";
import { verifyAccessToken } from "./jwt.js";

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice("Bearer ".length);

  let userId: string;

  try {
    const { userId: id } = await verifyAccessToken(token);
    userId = id;
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }

  request.user = { id: userId };
}

declare module "fastify" {
  interface FastifyRequest {
    user: { id: string };
  }
}
