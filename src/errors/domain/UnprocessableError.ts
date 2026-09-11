import { AppError, type AppErrorOptions } from "../AppError.js";

export class UnprocessableError extends AppError {
  constructor(message = "Unprocessable entity", options?: AppErrorOptions) {
    super(message, 422, "UNPROCESSABLE_ENTITY", true, options);
  }
}
