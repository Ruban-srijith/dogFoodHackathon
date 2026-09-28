import { db } from '../config/database';
import { Submission, SubmissionStatus } from '../models';

export interface EnrichedSubmission extends Submission {
  team_name: string;
  leader_id: string;
  track_name?: string | null;
  vote_count?: number;
  score_avg?: number;
  comments_count?: number;
}

export class SubmissionRepository {
  async findById(id: string): Promise<EnrichedSubmission | null> {
    const res = await db.query<EnrichedSubmission>(
      `SELECT s.*, t.name as team_name, t.leader_id, tr.name as track_name,
        (SELECT COUNT(*)::int FROM votes v WHERE v.submission_id = s.id) as vote_count,
        (SELECT COUNT(*)::int FROM comments c WHERE c.submission_id = s.id AND c.is_internal = false) as comments_count
       FROM submissions s
       JOIN teams t ON s.team_id = t.id
       LEFT JOIN tracks tr ON s.track_id = tr.id
       WHERE s.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByTeamId(teamId: string): Promise<Submission | null> {
    const res = await db.query<Submission>('SELECT * FROM submissions WHERE team_id = $1', [teamId]);
    return res.rows[0] || null;
  }

  async listByEvent(eventId: string, onlySubmitted: boolean = true): Promise<EnrichedSubmission[]> {
    let query = `
      SELECT s.*, t.name as team_name, t.leader_id, tr.name as track_name,
        (SELECT COUNT(*)::int FROM votes v WHERE v.submission_id = s.id) as vote_count,
        (SELECT COUNT(*)::int FROM comments c WHERE c.submission_id = s.id AND c.is_internal = false) as comments_count
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      LEFT JOIN tracks tr ON s.track_id = tr.id
      WHERE s.event_id = $1
    `;
    if (onlySubmitted) {
      query += " AND s.status = 'submitted'";
    }
    query += ' ORDER BY s.submitted_at DESC NULLS LAST, s.created_at DESC';

    const res = await db.query<EnrichedSubmission>(query, [eventId]);
    return res.rows;
  }

  async isMemberOfSubmissionTeam(userId: string, submissionId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM submissions s
       JOIN team_members tm ON s.team_id = tm.team_id
       WHERE s.id = $1 AND tm.user_id = $2`,
      [submissionId, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  async create(data: {
    event_id: string;
    team_id: string;
    track_id?: string | null;
    title: string;
    tagline: string;
    description: string;
    repo_url: string;
    demo_url?: string | null;
    video_url?: string | null;
    tech_stack?: string[];
    status?: SubmissionStatus;
  }): Promise<Submission> {
    const submittedAt = data.status === 'submitted' ? new Date().toISOString() : null;
    const res = await db.query<Submission>(
      `INSERT INTO submissions (event_id, team_id, track_id, title, tagline, description, repo_url, demo_url, video_url, tech_stack, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.event_id,
        data.team_id,
        data.track_id || null,
        data.title,
        data.tagline,
        data.description,
        data.repo_url,
        data.demo_url || null,
        data.video_url || null,
        data.tech_stack || [],
        data.status || 'draft',
        submittedAt,
      ]
    );
    return res.rows[0];
  }

  async update(id: string, data: Partial<Submission>): Promise<Submission | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (['track_id', 'title', 'tagline', 'description', 'repo_url', 'demo_url', 'video_url', 'tech_stack', 'status'].includes(key) && value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (data.status === 'submitted') {
      fields.push(`submitted_at = CURRENT_TIMESTAMP`);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await db.query<Submission>(
      `UPDATE submissions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }
}

export const submissionRepository = new SubmissionRepository();
