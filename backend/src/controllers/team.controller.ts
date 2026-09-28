import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { sendSuccess } from '../utils/response';

export class TeamController {
  async getTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamService.getTeamById(req.params.id);
      return sendSuccess(res, team);
    } catch (err) {
      next(err);
    }
  }

  async listTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const teams = await teamService.listTeamsForEvent(req.params.eventId);
      return sendSuccess(res, teams);
    } catch (err) {
      next(err);
    }
  }

  async getMyTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamService.getUserTeamForEvent(req.user!.userId, req.params.eventId);
      return sendSuccess(res, team);
    } catch (err) {
      next(err);
    }
  }

  async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamService.createTeam({
        ...req.body,
        leader_id: req.user!.userId,
      });
      return sendSuccess(res, team, 201);
    } catch (err) {
      next(err);
    }
  }

  async joinTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { invite_code } = req.body;
      const team = await teamService.joinTeam(invite_code, req.user!.userId);
      return sendSuccess(res, team, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const teamController = new TeamController();
