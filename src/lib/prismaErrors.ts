import { ConflictError } from "../errors/domain/ConflictError.js";
import { NotFoundError } from "../errors/domain/NotFoundError.js";
import { Prisma } from "../generated/prisma/client.js";

export async function withPrismaError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        throw new ConflictError("Resource already exists", { cause: err });
      }
      if (err.code === "P2025") {
        throw new NotFoundError("Resource not found", { cause: err });
      }
    }
    throw err;
  }
}
