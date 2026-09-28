import { db } from '../config/database';
import { Rubric, RubricCriterion } from '../models';

export interface RubricWithCriteria extends Rubric {
  criteria: RubricCriterion[];
}

export class RubricRepository {
  async findByEventId(eventId: string): Promise<RubricWithCriteria | null> {
    const rubricRes = await db.query<Rubric>(
      'SELECT * FROM rubrics WHERE event_id = $1 LIMIT 1',
      [eventId]
    );
    if (!rubricRes.rows[0]) return null;

    const rubric = rubricRes.rows[0];
    const criteriaRes = await db.query<RubricCriterion>(
      'SELECT * FROM rubric_criteria WHERE rubric_id = $1 ORDER BY created_at ASC',
      [rubric.id]
    );

    return {
      ...rubric,
      criteria: criteriaRes.rows,
    };
  }

  async findById(id: string): Promise<Rubric | null> {
    const res = await db.query<Rubric>('SELECT * FROM rubrics WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async create(data: { event_id: string; name: string; description?: string | null; max_score?: number }): Promise<Rubric> {
    const res = await db.query<Rubric>(
      `INSERT INTO rubrics (event_id, name, description, max_score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.event_id, data.name, data.description || null, data.max_score || 100]
    );
    return res.rows[0];
  }

  async addCriterion(data: {
    rubric_id: string;
    name: string;
    description?: string | null;
    weight?: number;
    max_points?: number;
  }): Promise<RubricCriterion> {
    const res = await db.query<RubricCriterion>(
      `INSERT INTO rubric_criteria (rubric_id, name, description, weight, max_points)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.rubric_id, data.name, data.description || null, data.weight || 1.0, data.max_points || 10]
    );
    return res.rows[0];
  }

  async getCriteria(rubricId: string): Promise<RubricCriterion[]> {
    const res = await db.query<RubricCriterion>(
      'SELECT * FROM rubric_criteria WHERE rubric_id = $1 ORDER BY created_at ASC',
      [rubricId]
    );
    return res.rows;
  }
}

export const rubricRepository = new RubricRepository();
