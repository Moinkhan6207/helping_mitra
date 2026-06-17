import { Request, Response, NextFunction } from 'express';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an asynchronous Express request handler function.
 * Automatically catches any rejected promises/errors and passes them to the next error middleware.
 * Eliminates the need for boilerplate try/catch blocks in controller routes.
 */
export const catchAsync = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
