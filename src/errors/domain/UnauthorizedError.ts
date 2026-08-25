import { AppError } from "../AppError.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", options?: ErrorOptions) {
    super(message, 401, "UNAUTHORIZED", true, options);
  }
}
