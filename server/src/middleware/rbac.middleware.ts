import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.model';
import { sendError } from '../utils/response.utils';

/**
 * Role-based access control middleware.
 * Must be used AFTER authenticate middleware.
 * @param roles  One or more roles that are permitted to access the route.
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      sendError(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
        403
      );
      return;
    }

    next();
  };
};
