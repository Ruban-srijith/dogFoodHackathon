import { db } from '../config/database';
import { User, SafeUser, UserRole } from '../models';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const res = await db.query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findSafeById(id: string): Promise<SafeUser | null> {
    const res = await db.query<SafeUser>(
      'SELECT id, username, email, role, full_name, bio, avatar_url, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const res = await db.query<User>('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const res = await db.query<User>('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return res.rows[0] || null;
  }

  async create(user: {
    username: string;
    email: string;
    password_hash: string;
    role: UserRole;
    full_name: string;
    bio?: string | null;
    avatar_url?: string | null;
  }): Promise<SafeUser> {
    const res = await db.query<SafeUser>(
      `INSERT INTO users (username, email, password_hash, role, full_name, bio, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, role, full_name, bio, avatar_url, created_at, updated_at`,
      [user.username, user.email, user.password_hash, user.role, user.full_name, user.bio || null, user.avatar_url || null]
    );
    return res.rows[0];
  }

  async updateRole(id: string, role: UserRole): Promise<SafeUser | null> {
    const res = await db.query<SafeUser>(
      `UPDATE users
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, role, full_name, bio, avatar_url, created_at, updated_at`,
      [role, id]
    );
    return res.rows[0] || null;
  }

  async listAll(role?: UserRole): Promise<SafeUser[]> {
    let query = 'SELECT id, username, email, role, full_name, bio, avatar_url, created_at, updated_at FROM users';
    const params: any[] = [];
    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    query += ' ORDER BY created_at DESC';
    const res = await db.query<SafeUser>(query, params);
    return res.rows;
  }
}

export const userRepository = new UserRepository();
