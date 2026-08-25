import { AppError } from "../AppError.js";

export class ValidationError extends AppError {
  constructor(message = "Validation error", options?: ErrorOptions) {
    super(message, 400, "VALIDATION_ERROR", true, options);
  }
}
