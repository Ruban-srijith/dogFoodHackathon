import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { UserRole } from '../models';

export class UserController {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as UserRole | undefined;
      const users = await userService.listUsers(role);
      return sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      return sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const user = await userService.updateUserRole(req.params.id, role, req.user!.userId);
      return sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
