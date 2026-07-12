export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static badRequest(message: string) {
    return new AppError(message, 400);
  }
}
