export interface AppErrorOptions extends ErrorOptions {
  context?: Record<string, unknown>;
}
export class AppError extends Error {
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly isOperational = true,
    options?: AppErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.context = options?.context;
    Error.captureStackTrace(this, this.constructor);
  }
}
