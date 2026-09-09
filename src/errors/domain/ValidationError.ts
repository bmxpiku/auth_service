import { AppError, type AppErrorOptions } from "../AppError.js";

export class ValidationError extends AppError {
  constructor(message = "Validation error", options?: AppErrorOptions) {
    super(message, 400, "VALIDATION_ERROR", true, options);
  }
}
