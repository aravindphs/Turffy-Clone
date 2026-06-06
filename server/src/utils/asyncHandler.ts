import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps an async route handler to automatically catch errors and pass them to next().
 * Eliminates the need for try-catch in every controller.
 */
const asyncHandler = (fn: AsyncHandlerFn): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
