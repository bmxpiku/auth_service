import { ConflictError } from "../errors/domain/ConflictError.js";
import { NotFoundError } from "../errors/domain/NotFoundError.js";
import { Prisma } from "../generated/prisma/client.js";

interface PrismaOperationContext {
  operation: string;
  model: string;
}
export async function withPrismaError<T>(fn: () => Promise<T>, context: PrismaOperationContext): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const diagnostics = {
        ...context,
        prismaCode: err.code,
        constraint: err.meta?.target,
      };

      if (err.code === "P2002") {
        throw new ConflictError("Resource already exists", { cause: err, context: diagnostics });
      }
      if (err.code === "P2025") {
        throw new NotFoundError("Resource not found", { cause: err, context: diagnostics });
      }
    }
    throw err;
  }
}
