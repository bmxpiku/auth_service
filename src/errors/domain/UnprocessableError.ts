import {AppError} from "../AppError.js";

export class UnprocessableError extends AppError {
    constructor(message = "Unprocessable entity") {
        super(message, 422, "UNPROCESSABLE_ENTITY");
    }
}