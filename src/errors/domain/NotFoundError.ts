import { AppError } from "../AppError.js";

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", options?: ErrorOptions) {
    super(message, 404, "NOT_FOUND", true, options);
  }
}
