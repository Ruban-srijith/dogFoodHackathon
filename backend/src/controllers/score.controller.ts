import { Request, Response, NextFunction } from 'express';
import { scoreService } from '../services/score.service';
import { sendSuccess } from '../utils/response';

export class ScoreController {
  async submitScore(req: Request, res: Response, next: NextFunction) {
    try {
      const score = await scoreService.submitScore({
        judge_id: req.user!.userId,
        submission_id: req.params.submissionId,
        criterion_id: req.body.criterion_id,
        points: Number(req.body.points),
        feedback: req.body.feedback,
      });
      return sendSuccess(res, score, 200);
    } catch (err) {
      next(err);
    }
  }

  async getMyScoresForSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const scores = await scoreService.getJudgeScoresForSubmission(req.user!.userId, req.params.submissionId);
      return sendSuccess(res, scores);
    } catch (err) {
      next(err);
    }
  }

  async getEventResults(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await scoreService.getAggregateResultsForEvent(req.params.eventId);
      return sendSuccess(res, results);
    } catch (err) {
      next(err);
    }
  }
}

export const scoreController = new ScoreController();
