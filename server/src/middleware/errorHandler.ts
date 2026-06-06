import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../config/env';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: string;
}

/**
 * Global error handling middleware.
 * Must be registered LAST, after all routes.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors: unknown = null;

  // --- Mongoose Validation Error ---
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // --- Mongoose Cast Error (invalid ObjectId) ---
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for field '${err.path}': ${err.value}`;
  }

  // --- MongoDB Duplicate Key Error ---
  else if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists.`;
  }

  // --- Zod Validation Error ---
  else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // --- JWT Errors ---
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Access token has expired. Please refresh your session.';
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  // Build response payload
  const payload: Record<string, unknown> = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  // Only include stack trace in development
  if (env.NODE_ENV === 'development') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

/**
 * 404 handler for unmatched routes.
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
