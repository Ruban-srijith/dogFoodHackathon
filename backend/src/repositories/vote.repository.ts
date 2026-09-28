import { db } from '../config/database';
import { Vote } from '../models';

export interface VoteLeaderboardItem {
  submission_id: string;
  submission_title: string;
  team_name: string;
  track_name?: string | null;
  vote_count: number;
}

export class VoteRepository {
  async findByUserAndEvent(userId: string, eventId: string): Promise<Vote | null> {
    const res = await db.query<Vote>(
      'SELECT * FROM votes WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );
    return res.rows[0] || null;
  }

  async create(data: { event_id: string; user_id: string; submission_id: string }): Promise<Vote> {
    const res = await db.query<Vote>(
      `INSERT INTO votes (event_id, user_id, submission_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.event_id, data.user_id, data.submission_id]
    );
    return res.rows[0];
  }

  async countBySubmission(submissionId: string): Promise<number> {
    const res = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM votes WHERE submission_id = $1',
      [submissionId]
    );
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  async getLeaderboard(eventId: string): Promise<VoteLeaderboardItem[]> {
    const res = await db.query<VoteLeaderboardItem>(
      `SELECT 
        s.id as submission_id,
        s.title as submission_title,
        t.name as team_name,
        tr.name as track_name,
        COUNT(v.id)::int as vote_count
       FROM submissions s
       JOIN teams t ON s.team_id = t.id
       LEFT JOIN tracks tr ON s.track_id = tr.id
       LEFT JOIN votes v ON s.id = v.submission_id
       WHERE s.event_id = $1 AND s.status = 'submitted'
       GROUP BY s.id, s.title, t.name, tr.name
       ORDER BY vote_count DESC, s.created_at ASC`,
      [eventId]
    );
    return res.rows;
  }
}

export const voteRepository = new VoteRepository();
