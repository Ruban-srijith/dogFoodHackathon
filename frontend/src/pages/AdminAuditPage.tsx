import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { AuditLog } from '../types';
import { Card } from '../components/Card';
import { Table, Column } from '../components/Table';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { formatDateTime } from '../utils/formatters';
import { ShieldCheck, RefreshCw } from 'lucide-react';
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
      // In our mock/standard API response meta gives totalPages or default
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
      header: 'Timestamp',
      align: 'left',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {formatDateTime(row.created_at)}
        </span>
      ),
      className: 'w-48',
    },
    {
      header: 'Action',
      accessor: 'action',
      align: 'center',
      render: (row) => (
        <Badge variant={getActionBadgeVariant(row.action)} size="sm">
          {row.action}
        </Badge>
      ),
    },
    {
      header: 'Actor',
      align: 'left',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-200 block text-xs">
            {row.user_name || 'System / Anonymous'}
          </span>
          {row.user_email && <span className="text-[10px] text-slate-400 font-mono">{row.user_email}</span>}
        </div>
      ),
    },
    {
      header: 'Entity',
      align: 'left',
      render: (row) => (
        <span className="font-mono text-xs text-sky-400">
          {row.entity_type} {row.entity_id ? `(${row.entity_id.slice(0, 8)}...)` : ''}
        </span>
      ),
    },
    {
      header: 'Audit Metadata (JSON)',
      align: 'left',
      render: (row) => (
        <pre className="text-[10px] font-mono text-slate-400 max-w-xs truncate bg-slate-950/60 p-1.5 rounded border border-slate-800">
          {JSON.stringify(row.details || {})}
        </pre>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Immutable Security Ledger
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Audit Trail & Compliance</h1>
          <p className="text-xs text-slate-400">
            Append-only security log recording every critical state transition across the platform
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => fetchLogs(page)} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh Trail
        </Button>
      </div>

      {loading ? (
        <Loading message="Fetching audit trail..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchLogs(page)} fullScreen />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table borderless columns={columns} data={logs} keyExtractor={(l) => l.id} />
          <div className="px-5">
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
