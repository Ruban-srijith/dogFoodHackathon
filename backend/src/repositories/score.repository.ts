import { db } from '../config/database';
import { Score } from '../models';

export interface EnrichedScore extends Score {
  criterion_name: string;
  max_points: number;
  weight: number;
  judge_name: string;
}

export interface SubmissionScoreAggregate {
  submission_id: string;
  submission_title: string;
  team_name: string;
  track_name?: string | null;
  avg_score: number;
  total_judges_scored: number;
  scores_breakdown: {
    criterion_name: string;
    avg_points: number;
    max_points: number;
  }[];
}

export class ScoreRepository {
  async findByAssignment(assignmentId: string): Promise<EnrichedScore[]> {
    const res = await db.query<EnrichedScore>(
      `SELECT s.*, rc.name as criterion_name, rc.max_points, rc.weight, u.full_name as judge_name
       FROM scores s
       JOIN rubric_criteria rc ON s.criterion_id = rc.id
       JOIN users u ON s.judge_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY rc.created_at ASC`,
      [assignmentId]
    );
    return res.rows;
  }

  async findByJudgeAndSubmission(judgeId: string, submissionId: string): Promise<EnrichedScore[]> {
    const res = await db.query<EnrichedScore>(
      `SELECT s.*, rc.name as criterion_name, rc.max_points, rc.weight, u.full_name as judge_name
       FROM scores s
       JOIN rubric_criteria rc ON s.criterion_id = rc.id
       JOIN users u ON s.judge_id = u.id
       WHERE s.judge_id = $1 AND s.submission_id = $2
       ORDER BY rc.created_at ASC`,
      [judgeId, submissionId]
    );
    return res.rows;
  }

  async upsertScore(data: {
    assignment_id: string;
    judge_id: string;
    submission_id: string;
    criterion_id: string;
    points: number;
    feedback?: string | null;
  }): Promise<Score> {
    const res = await db.query<Score>(
      `INSERT INTO scores (assignment_id, judge_id, submission_id, criterion_id, points, feedback)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (judge_id, submission_id, criterion_id)
       DO UPDATE SET points = EXCLUDED.points, feedback = EXCLUDED.feedback, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [data.assignment_id, data.judge_id, data.submission_id, data.criterion_id, data.points, data.feedback || null]
    );
    return res.rows[0];
  }

  async getAggregateScoresForEvent(eventId: string): Promise<SubmissionScoreAggregate[]> {
    const res = await db.query<SubmissionScoreAggregate>(
      `SELECT 
        s.id as submission_id,
        s.title as submission_title,
        t.name as team_name,
        tr.name as track_name,
        COALESCE(ROUND(AVG(sc.points * rc.weight), 2), 0) as avg_score,
        COUNT(DISTINCT sc.judge_id)::int as total_judges_scored
       FROM submissions s
       JOIN teams t ON s.team_id = t.id
       LEFT JOIN tracks tr ON s.track_id = tr.id
       LEFT JOIN scores sc ON s.id = sc.submission_id
       LEFT JOIN rubric_criteria rc ON sc.criterion_id = rc.id
       WHERE s.event_id = $1 AND s.status = 'submitted'
       GROUP BY s.id, s.title, t.name, tr.name
       ORDER BY avg_score DESC`,
      [eventId]
    );

    return res.rows.map((row: SubmissionScoreAggregate) => ({
      ...row,
      scores_breakdown: [],
    }));
  }
}

export const scoreRepository = new ScoreRepository();
