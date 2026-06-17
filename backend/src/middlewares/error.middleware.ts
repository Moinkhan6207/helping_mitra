import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/app.error';
import { sendError } from '../core/responses/api.response';
import { env } from '../config/env';

/**
 * Global Express Error Handling Middleware.
 * Standardizes all application errors, maps uncaught errors, and prevents stack traces leaking in production.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
): void => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: any = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else {
    // Unhandled operational/system error (logging details on server)
    console.error('💥 Critical Unhandled Error:', err);
    
    // Map common express payload parser syntax errors
    if (err.name === 'SyntaxError' && 'status' in err && (err as any).status === 400) {
      statusCode = 400;
      message = 'Invalid JSON request payload';
      code = 'BAD_REQUEST';
    }
    
    // Map validation schema errors (e.g. from parsing packages)
    if (err.name === 'ZodError') {
      statusCode = 400;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
      details = (err as any).errors;
    }
  }

  // Hide internal call stack from clients in production
  const errorDetails = env.NODE_ENV === 'production'
    ? details
    : {
        ...(details && typeof details === 'object' ? details : { rawDetails: details }),
        stack: err.stack,
      };

  sendError(res, message, code, errorDetails, statusCode);
};
