import { db } from '../config/database';
import { Track } from '../models';

export class TrackRepository {
  async findByEventId(eventId: string): Promise<Track[]> {
    const res = await db.query<Track>(
      'SELECT * FROM tracks WHERE event_id = $1 ORDER BY name ASC',
      [eventId]
    );
    return res.rows;
  }

  async findById(id: string): Promise<Track | null> {
    const res = await db.query<Track>('SELECT * FROM tracks WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async create(data: { event_id: string; name: string; description?: string | null; prize_pool?: string | null }): Promise<Track> {
    const res = await db.query<Track>(
      `INSERT INTO tracks (event_id, name, description, prize_pool)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.event_id, data.name, data.description || null, data.prize_pool || null]
    );
    return res.rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.query('DELETE FROM tracks WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }
}

export const trackRepository = new TrackRepository();
