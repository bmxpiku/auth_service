import { AppError, type AppErrorOptions } from "../AppError.js";

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", options?: AppErrorOptions) {
    super(message, 403, "FORBIDDEN", true, options);
  }
}
