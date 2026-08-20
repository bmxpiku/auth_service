import { ConflictError } from "../errors/domain/ConflictError.js";
import { NotFoundError } from "../errors/domain/NotFoundError.js";
import { PrismaClientKnownRequestError } from "../generated/prisma/internal/prismaNamespace.js";

export async function withPrismaError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        throw new ConflictError("Resource already exists");
      }
      if (err.code === "P2025") {
        throw new NotFoundError("Resource not found");
      }
    }
    throw err;
  }
}
