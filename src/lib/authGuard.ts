import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedError } from "../errors/domain/UnauthorizedError.js";

export async function authGuard(request: FastifyRequest, _reply: FastifyReply) {
  let payload: { sub: string };

  try {
    payload = await request.jwtVerify<{ sub: string }>();
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }

  request.user = { id: payload.sub };
}

/**
 * The only sanctioned way to read the authenticated user inside a route
 * handler. `request.user` is only populated when `authGuard` ran as a
 * `preHandler` on that route — accessing it directly would type-check even
 * on unguarded routes and crash at runtime. This throws loudly instead,
 * surfacing a missing-`preHandler` bug immediately rather than silently
 * returning `undefined.id`.
 */
export function requireUser(request: FastifyRequest): { id: string } {
  if (!request.user) {
    throw new Error("requireUser() called on a route without authGuard as preHandler");
  }

  return request.user;
}

// @fastify/jwt already declares `FastifyRequest.user` (typed via this
// FastifyJWT.user hook) — redeclaring it ourselves on `FastifyRequest`
// directly would conflict (TS2717: duplicate declarations must match
// exactly, and the plugin's default type is `string | object | Buffer`).
// `| undefined` here (rather than always-present) is deliberate: it forces
// every reader to go through requireUser() instead of trusting a type that
// lies about routes with no guard.
declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: { id: string } | undefined;
  }
}
