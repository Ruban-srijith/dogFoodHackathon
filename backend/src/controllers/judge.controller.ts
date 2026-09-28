import { Request, Response, NextFunction } from 'express';
import { judgeService } from '../services/judge.service';
import { sendSuccess } from '../utils/response';

export class JudgeController {
  async getMyAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.query.eventId as string | undefined;
      const assignments = await judgeService.getAssignmentsForJudge(req.user!.userId, eventId);
      return sendSuccess(res, assignments);
    } catch (err) {
      next(err);
    }
  }

  async getSubmissionForJudging(req: Request, res: Response, next: NextFunction) {
    try {
      const detail = await judgeService.getJudgeSubmissionDetail(req.user!.userId, req.params.submissionId);
      return sendSuccess(res, detail);
    } catch (err) {
      next(err);
    }
  }

  async assignJudge(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = await judgeService.assignJudge({
        event_id: req.body.event_id,
        judge_id: req.body.judge_id,
        submission_id: req.body.submission_id,
        assignerUserId: req.user!.userId,
      });
      return sendSuccess(res, assignment, 201);
    } catch (err) {
      next(err);
    }
  }

  async removeAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      await judgeService.removeAssignment(req.params.id, req.user!.userId);
      return sendSuccess(res, { message: 'Judge assignment removed successfully' });
    } catch (err) {
      next(err);
    }
  }

  async listEventAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = await judgeService.listAssignmentsForEvent(req.params.eventId);
      return sendSuccess(res, assignments);
    } catch (err) {
      next(err);
    }
  }
}

export const judgeController = new JudgeController();
