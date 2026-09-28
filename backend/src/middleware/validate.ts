import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodIssue } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e: ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError('Input validation failed', issues));
      }
      return next(error);
    }
  };
};
