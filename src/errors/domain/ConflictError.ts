import { AppError, type AppErrorOptions } from "../AppError.js";

export class ConflictError extends AppError {
  constructor(message = "Conflict", options?: AppErrorOptions) {
    super(message, 409, "CONFLICT", true, options);
  }
}
