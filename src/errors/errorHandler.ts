import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "./AppError.js";

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if ("validation" in error && error.validation) {
    reply.status(400).send({
      error: "BAD_REQUEST",
      message: "Request validation failed",
      details: error.validation,
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
    });
    return;
  }

  // Log full error details (including stack trace) for unexpected errors — never expose to client
  request.log.error({ err: error }, "Unexpected error");

  reply.status(500).send({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}
