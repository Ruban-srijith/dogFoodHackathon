import { db } from '../config/database';
import { Team, TeamMember, SafeUser } from '../models';

export class TeamRepository {
  async findById(id: string): Promise<Team | null> {
    const res = await db.query<Team>('SELECT * FROM teams WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findByInviteCode(inviteCode: string): Promise<Team | null> {
    const res = await db.query<Team>('SELECT * FROM teams WHERE invite_code = $1', [inviteCode]);
    return res.rows[0] || null;
  }

  async listByEvent(eventId: string): Promise<Team[]> {
    const res = await db.query<Team>(
      'SELECT * FROM teams WHERE event_id = $1 ORDER BY created_at ASC',
      [eventId]
    );
    return res.rows;
  }

  async findUserTeamInEvent(userId: string, eventId: string): Promise<Team | null> {
    const res = await db.query<Team>(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND t.event_id = $2`,
      [userId, eventId]
    );
    return res.rows[0] || null;
  }

  async create(data: {
    event_id: string;
    name: string;
    slug: string;
    description?: string | null;
    leader_id: string;
    invite_code: string;
  }): Promise<Team> {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const teamRes = await client.query<Team>(
        `INSERT INTO teams (event_id, name, slug, description, leader_id, invite_code)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.event_id, data.name, data.slug, data.description || null, data.leader_id, data.invite_code]
      );
      const team = teamRes.rows[0];

      // Automatically add leader to team_members
      await client.query(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES ($1, $2, 'leader')`,
        [team.id, data.leader_id]
      );

      await client.query('COMMIT');
      return team;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async addMember(teamId: string, userId: string, role: 'leader' | 'member' = 'member'): Promise<TeamMember> {
    const res = await db.query<TeamMember>(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [teamId, userId, role]
    );
    return res.rows[0];
  }

  async removeMember(teamId: string, userId: string): Promise<boolean> {
    const res = await db.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    return (res.rowCount || 0) > 0;
  }

  async getMembers(teamId: string): Promise<(SafeUser & { member_role: string; joined_at: string })[]> {
    const res = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.full_name, u.avatar_url, tm.role as member_role, tm.joined_at
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );
    return res.rows;
  }
}

export const teamRepository = new TeamRepository();
