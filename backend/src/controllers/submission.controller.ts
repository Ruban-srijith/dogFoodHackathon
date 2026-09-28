import { Request, Response, NextFunction } from 'express';
import { submissionService } from '../services/submission.service';
import { sendSuccess } from '../utils/response';

export class SubmissionController {
  async getSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await submissionService.getSubmissionById(
        req.params.id,
        req.user ? { userId: req.user.userId, role: req.user.role } : undefined
      );
      return sendSuccess(res, submission);
    } catch (err) {
      next(err);
    }
  }

  async listGallery(req: Request, res: Response, next: NextFunction) {
    try {
      const submissions = await submissionService.listGallerySubmissions(req.params.eventId);
      return sendSuccess(res, submissions);
    } catch (err) {
      next(err);
    }
  }

  async listEventSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const submissions = await submissionService.listEventSubmissions(
        req.params.eventId,
        req.user ? { userId: req.user.userId, role: req.user.role } : undefined
      );
      return sendSuccess(res, submissions);
    } catch (err) {
      next(err);
    }
  }

  async createSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await submissionService.createSubmission({
        ...req.body,
        userId: req.user!.userId,
        userRole: req.user!.role,
      });
      return sendSuccess(res, submission, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const submission = await submissionService.updateSubmission(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.role
      );
      return sendSuccess(res, submission);
    } catch (err) {
      next(err);
    }
  }
}

export const submissionController = new SubmissionController();
