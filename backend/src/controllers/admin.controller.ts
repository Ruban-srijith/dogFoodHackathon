import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { db } from '../config/database';
import { sendSuccess } from '../utils/response';

export class AdminController {
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '50', 10);
      const result = await auditService.getLogs(page, limit);
      return sendSuccess(res, result.logs, 200, {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPlatformStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const [usersCount, eventsCount, teamsCount, submissionsCount, votesCount, scoresCount] = await Promise.all([
        db.query('SELECT COUNT(*)::int as count FROM users'),
        db.query('SELECT COUNT(*)::int as count FROM events'),
        db.query('SELECT COUNT(*)::int as count FROM teams'),
        db.query("SELECT COUNT(*)::int as count FROM submissions WHERE status = 'submitted'"),
        db.query('SELECT COUNT(*)::int as count FROM votes'),
        db.query('SELECT COUNT(*)::int as count FROM scores'),
      ]);

      const stats = {
        totalUsers: usersCount.rows[0].count,
        totalEvents: eventsCount.rows[0].count,
        totalTeams: teamsCount.rows[0].count,
        totalSubmissions: submissionsCount.rows[0].count,
        totalVotes: votesCount.rows[0].count,
        totalScores: scoresCount.rows[0].count,
      };

      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
