import { Request, Response, NextFunction } from 'express';
import { voteService } from '../services/vote.service';
import { sendSuccess } from '../utils/response';

export class VoteController {
  async castVote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await voteService.castVote({
        event_id: req.body.event_id,
        submission_id: req.body.submission_id,
        user_id: req.user!.userId,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const leaderboard = await voteService.getLeaderboard(req.params.eventId);
      return sendSuccess(res, leaderboard);
    } catch (err) {
      next(err);
    }
  }

  async getMyVote(req: Request, res: Response, next: NextFunction) {
    try {
      const vote = await voteService.getUserVoteForEvent(req.user!.userId, req.params.eventId);
      return sendSuccess(res, vote);
    } catch (err) {
      next(err);
    }
  }
}

export const voteController = new VoteController();
