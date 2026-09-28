import { db } from '../config/database';
import { Event, EventStatus } from '../models';

export class EventRepository {
  async findById(id: string): Promise<Event | null> {
    const res = await db.query<Event>('SELECT * FROM events WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const res = await db.query<Event>('SELECT * FROM events WHERE slug = $1', [slug]);
    return res.rows[0] || null;
  }

  async listAll(status?: EventStatus): Promise<Event[]> {
    let query = 'SELECT * FROM events';
    const params: any[] = [];
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY start_date DESC';
    const res = await db.query<Event>(query, params);
    return res.rows;
  }

  async listPublished(): Promise<Event[]> {
    const res = await db.query<Event>(
      "SELECT * FROM events WHERE status != 'draft' ORDER BY start_date DESC"
    );
    return res.rows;
  }

  async create(data: {
    title: string;
    slug: string;
    description: string;
    start_date: string;
    end_date: string;
    submission_deadline: string;
    status?: EventStatus;
    banner_url?: string | null;
    location?: string | null;
    created_by: string;
  }): Promise<Event> {
    const res = await db.query<Event>(
      `INSERT INTO events (title, slug, description, start_date, end_date, submission_deadline, status, banner_url, location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.title,
        data.slug,
        data.description,
        data.start_date,
        data.end_date,
        data.submission_deadline,
        data.status || 'draft',
        data.banner_url || null,
        data.location || 'Online / Global',
        data.created_by,
      ]
    );
    return res.rows[0];
  }

  async update(id: string, data: Partial<Event>): Promise<Event | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (['title', 'slug', 'description', 'start_date', 'end_date', 'submission_deadline', 'status', 'banner_url', 'location'].includes(key) && value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await db.query<Event>(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.query('DELETE FROM events WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const eventRepository = new EventRepository();
