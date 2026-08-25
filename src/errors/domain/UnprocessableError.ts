import { AppError } from "../AppError.js";

export class UnprocessableError extends AppError {
  constructor(message = "Unprocessable entity", options?: ErrorOptions) {
    super(message, 422, "UNPROCESSABLE_ENTITY", true, options);
  }
}
