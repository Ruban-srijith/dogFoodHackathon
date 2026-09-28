import { db } from '../config/database';
import { Comment } from '../models';

export interface EnrichedComment extends Comment {
  author_name: string;
  author_role: string;
  author_avatar?: string | null;
}

export class CommentRepository {
  async listBySubmission(submissionId: string, includeInternal: boolean = false): Promise<EnrichedComment[]> {
    let query = `
      SELECT c.*, u.full_name as author_name, u.role as author_role, u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.submission_id = $1
    `;
    if (!includeInternal) {
      query += ' AND c.is_internal = false';
    }
    query += ' ORDER BY c.created_at ASC';

    const res = await db.query<EnrichedComment>(query, [submissionId]);
    return res.rows;
  }

  async create(data: {
    submission_id: string;
    user_id: string;
    content: string;
    is_internal?: boolean;
  }): Promise<EnrichedComment> {
    const res = await db.query<Comment>(
      `INSERT INTO comments (submission_id, user_id, content, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.submission_id, data.user_id, data.content, data.is_internal || false]
    );

    const full = await db.query<EnrichedComment>(
      `SELECT c.*, u.full_name as author_name, u.role as author_role, u.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [res.rows[0].id]
    );
    return full.rows[0];
  }

  async findById(id: string): Promise<Comment | null> {
    const res = await db.query<Comment>('SELECT * FROM comments WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.query('DELETE FROM comments WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const commentRepository = new CommentRepository();
