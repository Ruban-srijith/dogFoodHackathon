import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import { User, UserRole } from '../types';
import { Card } from '../components/Card';
import { Table, Column } from '../components/Table';
import { RoleBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { formatDate } from '../utils/formatters';
import { Users } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const updated = await adminService.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      success(`Updated role for ${updated.full_name} to ${newRole}`);
    } catch (err: any) {
      toastError(err.message || 'Failed to update user role');
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'User',
      accessor: 'full_name',
      render: (row) => (
        <div>
          <span className="font-bold text-[var(--text-main)] block font-mono">{row.full_name}</span>
          <span className="text-xs text-[var(--text-muted)] font-mono">@{row.username}</span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => <span className="font-mono text-xs text-[var(--text-muted)]">{row.email}</span>,
    },
    {
      header: 'Current Role',
      accessor: 'role',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      header: 'Created At',
      render: (row) => <span className="text-xs text-[var(--text-muted)] font-mono">{formatDate(row.created_at)}</span>,
    },
    {
      header: 'Change Role (Admin Control)',
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row.id, e.target.value as UserRole)}
          className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs px-2.5 py-1 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] font-mono"
        >
          <option value="VISITOR">VISITOR</option>
          <option value="PARTICIPANT">PARTICIPANT</option>
          <option value="JUDGE">JUDGE</option>
          <option value="ORGANIZER">ORGANIZER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      ),
      className: 'w-48 text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-red)] uppercase tracking-wider font-mono">
          <Users className="w-3.5 h-3.5 text-[var(--accent-red)]" /> Identity & Access Governance
        </div>
        <h1 className="text-3xl font-black text-[var(--text-main)] font-mono mt-1">User Directory & Roles</h1>
        <p className="text-xs text-[var(--text-muted)] font-sans">
          Manage system privileges and promote users to Judges, Organizers, or System Administrators
        </p>
      </div>

      {loading ? (
        <Loading message="Loading user directory..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} fullScreen />
      ) : (
        <Card className="p-0 overflow-hidden theme-card">
          <Table columns={columns} data={users} keyExtractor={(u) => u.id} />
        </Card>
      )}
    </div>
  );
};
