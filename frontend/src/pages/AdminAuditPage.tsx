import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { AuditLog } from '../types';
import { Card } from '../components/Card';
import { Table, Column } from '../components/Table';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { formatDateTime } from '../utils/formatters';
import { RefreshCw, Users, ShieldAlert } from 'lucide-react';
import { Button } from '../components/Button';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAuditLogs(pageNum, 25);
      setLogs(data);
      setTotalPages(Math.max(1, Math.ceil(data.length / 25)));
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('LOGIN') || action.includes('CREATED') || action.includes('SUBMITTED')) return 'success';
    if (action.includes('ASSIGNED') || action.includes('UPDATED')) return 'info';
    if (action.includes('REJECTED') || action.includes('DELETE')) return 'danger';
    return 'default';
  };

  const columns: Column<AuditLog>[] = [
    {
      header: 'TIMESTAMP',
      align: 'left',
      render: (row) => (
        <span className="font-mono text-xs text-[#94A3B8]">
          {formatDateTime(row.created_at)}
        </span>
      ),
      className: 'w-48',
    },
    {
      header: 'ACTION',
      accessor: 'action',
      align: 'center',
      render: (row) => (
        <Badge variant={getActionBadgeVariant(row.action)} size="sm">
          {row.action}
        </Badge>
      ),
    },
    {
      header: 'ACTOR',
      align: 'left',
      render: (row) => (
        <div>
          <span className="font-semibold text-[#E2E8F0] block text-xs">
            {row.user_name || 'System / Anonymous'}
          </span>
          {row.user_email && <span className="text-[10px] text-[#94A3B8] font-mono">{row.user_email}</span>}
        </div>
      ),
    },
    {
      header: 'TARGET ENTITY',
      align: 'left',
      render: (row) => (
        <span className="font-mono text-xs text-[#A78BFA]">
          {row.entity_type} {row.entity_id ? `(${row.entity_id.slice(0, 8)}...)` : ''}
        </span>
      ),
    },
    {
      header: 'METADATA (JSON)',
      align: 'left',
      render: (row) => (
        <pre className="text-[10px] font-mono text-[#94A3B8] max-w-xs truncate bg-[#0F172A] p-1.5 rounded-[4px] border border-[#334155]">
          {JSON.stringify(row.details || {})}
        </pre>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-body">
      {/* Top Header & Distinct Page Accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 opacity-80">
              <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
              <span className="w-1.5 h-3 bg-[#A78BFA] skew-x-[-25deg]" />
            </div>
            <div className="transform -rotate-1 select-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#A78BFA] text-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3 h-3 stroke-[2.5]" />
                IMMUTABLE AUDIT LOG
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            Security & Audit Ledger
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Cryptographically verifiable record of state changes, authentications, and governance events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/admin/users">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Users className="w-4 h-4 text-[#0F172A]" />}
              className="font-mono text-xs uppercase font-bold rounded-[4px]"
            >
              Manage Users & Directory
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs(page)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#94A3B8]" />}
            className="font-mono text-xs rounded-[4px]"
          >
            Refresh Log
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading message="Fetching security audit trail..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchLogs(page)} fullScreen />
      ) : (
        <Card className="p-0 overflow-hidden rounded-[16px] border border-[#334155] bg-[#1E293B] shadow-lg">
          <Table borderless columns={columns} data={logs} keyExtractor={(l) => l.id} emptyMessage="No audit trail events recorded yet." />
          <div className="px-5 py-3 border-t border-[#334155]">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </Card>
      )}
    </div>
  );
};
