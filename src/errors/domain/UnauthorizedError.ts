import { AppError, type AppErrorOptions } from "../AppError.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", options?: AppErrorOptions) {
    super(message, 401, "UNAUTHORIZED", true, options);
  }
}
