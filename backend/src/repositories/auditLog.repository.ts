import { db } from '../config/database';
import { AuditLog, AuditAction } from '../models';

export interface EnrichedAuditLog extends AuditLog {
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
}

export class AuditLogRepository {
  async create(data: {
    user_id?: string | null;
    action: AuditAction;
    entity_type: string;
    entity_id?: string | null;
    details?: Record<string, any>;
    ip_address?: string | null;
    user_agent?: string | null;
  }): Promise<AuditLog> {
    const res = await db.query<AuditLog>(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.user_id || null,
        data.action,
        data.entity_type,
        data.entity_id || null,
        JSON.stringify(data.details || {}),
        data.ip_address || null,
        data.user_agent || null,
      ]
    );
    return res.rows[0];
  }

  async list(limit: number = 100, offset: number = 0): Promise<EnrichedAuditLog[]> {
    const res = await db.query<EnrichedAuditLog>(
      `SELECT a.*, u.full_name as user_name, u.email as user_email, u.role as user_role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  }

  async count(): Promise<number> {
    const res = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM audit_logs');
    return parseInt(res.rows[0]?.count || '0', 10);
  }
}

export const auditLogRepository = new AuditLogRepository();
