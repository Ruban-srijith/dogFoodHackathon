import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { isOneOf } from '../auth/roles';

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!isOneOf(req.user.role, allowedRoles)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }

    next();
  };
};
