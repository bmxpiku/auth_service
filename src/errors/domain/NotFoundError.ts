import { AppError, type AppErrorOptions } from "../AppError.js";

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", options?: AppErrorOptions) {
    super(message, 404, "NOT_FOUND", true, options);
  }
}
