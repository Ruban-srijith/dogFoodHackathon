import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  // Check if it is a known operational error
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.message}`, {
      requestId: req.requestId,
      code: err.code,
      status: err.statusCode,
      path: req.originalUrl,
    });
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle PostgreSQL unique constraint violations cleanly
  if (err.code === '23505') {
    logger.warn(`DB Unique Violation: ${err.detail}`, {
      requestId: req.requestId,
      path: req.originalUrl,
    });
    return sendError(res, 'A record with this unique value already exists.', 409, 'CONFLICT');
  }

  // Handle PostgreSQL foreign key violations cleanly
  if (err.code === '23503') {
    logger.warn(`DB FK Violation: ${err.detail}`, {
      requestId: req.requestId,
      path: req.originalUrl,
    });
    return sendError(res, 'Referenced record was not found or has dependent items.', 400, 'BAD_REQUEST');
  }

  // Unhandled / Internal Server Error - protect internals
  logger.error(`Unhandled Server Error: ${err.message}`, {
    requestId: req.requestId,
    stack: err.stack,
    path: req.originalUrl,
  });

  return sendError(
    res,
    'An unexpected internal error occurred. Please try again later.',
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
