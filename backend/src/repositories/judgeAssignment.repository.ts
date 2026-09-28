import { db } from '../config/database';
import { JudgeAssignment, AssignmentStatus } from '../models';

export interface EnrichedJudgeAssignment extends JudgeAssignment {
  submission_title: string;
  submission_tagline: string;
  submission_repo_url: string;
  submission_demo_url?: string | null;
  submission_video_url?: string | null;
  submission_description: string;
  team_name: string;
  judge_name: string;
  judge_email: string;
  scored_criteria_count?: number;
  total_criteria_count?: number;
}

export class JudgeAssignmentRepository {
  async findById(id: string): Promise<JudgeAssignment | null> {
    const res = await db.query<JudgeAssignment>('SELECT * FROM judge_assignments WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findByJudgeAndSubmission(judgeId: string, submissionId: string): Promise<JudgeAssignment | null> {
    const res = await db.query<JudgeAssignment>(
      'SELECT * FROM judge_assignments WHERE judge_id = $1 AND submission_id = $2',
      [judgeId, submissionId]
    );
    return res.rows[0] || null;
  }

  async listAssignmentsForJudge(judgeId: string, eventId?: string): Promise<EnrichedJudgeAssignment[]> {
    let query = `
      SELECT ja.*, s.title as submission_title, s.tagline as submission_tagline,
             s.repo_url as submission_repo_url, s.demo_url as submission_demo_url,
             s.video_url as submission_video_url, s.description as submission_description,
             t.name as team_name, u.full_name as judge_name, u.email as judge_email,
             (SELECT COUNT(*)::int FROM scores sc WHERE sc.assignment_id = ja.id) as scored_criteria_count
      FROM judge_assignments ja
      JOIN submissions s ON ja.submission_id = s.id
      JOIN teams t ON s.team_id = t.id
      JOIN users u ON ja.judge_id = u.id
      WHERE ja.judge_id = $1
    `;
    const params: any[] = [judgeId];
    if (eventId) {
      query += ' AND ja.event_id = $2';
      params.push(eventId);
    }
    query += ' ORDER BY ja.assigned_at DESC';

    const res = await db.query<EnrichedJudgeAssignment>(query, params);
    return res.rows;
  }

  async listAssignmentsForEvent(eventId: string): Promise<EnrichedJudgeAssignment[]> {
    const query = `
      SELECT ja.*, s.title as submission_title, s.tagline as submission_tagline,
             s.repo_url as submission_repo_url, s.demo_url as submission_demo_url,
             s.video_url as submission_video_url, s.description as submission_description,
             t.name as team_name, u.full_name as judge_name, u.email as judge_email,
             (SELECT COUNT(*)::int FROM scores sc WHERE sc.assignment_id = ja.id) as scored_criteria_count
      FROM judge_assignments ja
      JOIN submissions s ON ja.submission_id = s.id
      JOIN teams t ON s.team_id = t.id
      JOIN users u ON ja.judge_id = u.id
      WHERE ja.event_id = $1
      ORDER BY ja.assigned_at DESC
    `;
    const res = await db.query<EnrichedJudgeAssignment>(query, [eventId]);
    return res.rows;
  }

  async create(data: { event_id: string; judge_id: string; submission_id: string }): Promise<JudgeAssignment> {
    const res = await db.query<JudgeAssignment>(
      `INSERT INTO judge_assignments (event_id, judge_id, submission_id, status)
       VALUES ($1, $2, $3, 'assigned')
       RETURNING *`,
      [data.event_id, data.judge_id, data.submission_id]
    );
    return res.rows[0];
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<JudgeAssignment | null> {
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const res = await db.query<JudgeAssignment>(
      `UPDATE judge_assignments
       SET status = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, completedAt, id]
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.query('DELETE FROM judge_assignments WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const judgeAssignmentRepository = new JudgeAssignmentRepository();
