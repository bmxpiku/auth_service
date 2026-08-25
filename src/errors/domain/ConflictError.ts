import { AppError } from "../AppError.js";

export class ConflictError extends AppError {
  constructor(message = "Conflict", options?: ErrorOptions) {
    super(message, 409, "CONFLICT", true, options);
  }
}
