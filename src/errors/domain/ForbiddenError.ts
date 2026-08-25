import { AppError } from "../AppError.js";

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", options?: ErrorOptions) {
    super(message, 403, "FORBIDDEN", true, options);
  }
}
