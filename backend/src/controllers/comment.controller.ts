import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import { sendSuccess } from '../utils/response';

export class CommentController {
  async listComments(req: Request, res: Response, next: NextFunction) {
    try {
      const comments = await commentService.listComments(
        req.params.submissionId,
        req.user ? { userId: req.user.userId, role: req.user.role } : undefined
      );
      return sendSuccess(res, comments);
    } catch (err) {
      next(err);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await commentService.createComment({
        submission_id: req.params.submissionId,
        user_id: req.user!.userId,
        user_role: req.user!.role,
        content: req.body.content,
        is_internal: req.body.is_internal,
      });
      return sendSuccess(res, comment, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      await commentService.deleteComment(req.params.id, req.user!.userId, req.user!.role);
      return sendSuccess(res, { message: 'Comment deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const commentController = new CommentController();
