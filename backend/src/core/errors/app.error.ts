export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: string = 'INTERNAL_SERVER_ERROR',
    details: any = null,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Capture the stack trace, keeping the constructor call out of it
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', code: string = 'BAD_REQUEST', details: any = null) {
    super(400, message, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', details: any = null) {
    super(401, message, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN', details: any = null) {
    super(403, message, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource Not Found', code: string = 'NOT_FOUND', details: any = null) {
    super(404, message, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code: string = 'CONFLICT', details: any = null) {
    super(409, message, code, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests', code: string = 'TOO_MANY_REQUESTS', details: any = null) {
    super(429, message, code, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', code: string = 'INTERNAL_SERVER_ERROR', details: any = null) {
    super(500, message, code, details, false);
  }
}
