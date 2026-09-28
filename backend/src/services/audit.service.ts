import { auditLogRepository, EnrichedAuditLog } from '../repositories/auditLog.repository';
import { AuditAction, AuditLog } from '../models';

export class AuditService {
  async log(data: {
    user_id?: string | null;
    action: AuditAction;
    entity_type: string;
    entity_id?: string | null;
    details?: Record<string, any>;
    ip_address?: string | null;
    user_agent?: string | null;
  }): Promise<AuditLog> {
    try {
      return await auditLogRepository.create(data);
    } catch (err: any) {
      console.error('[AUDIT_LOG_ERROR] Failed to record audit log:', err.message);
      // Non-blocking for normal operations unless strict mode
      return {} as AuditLog;
    }
  }

  async getLogs(page: number = 1, limit: number = 50): Promise<{ logs: EnrichedAuditLog[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      auditLogRepository.list(limit, offset),
      auditLogRepository.count(),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const auditService = new AuditService();
