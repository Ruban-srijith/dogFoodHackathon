import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import { User, UserRole } from '../types';
import { Card } from '../components/Card';
import { Table, Column } from '../components/Table';
import { RoleBadge } from '../components/Badge';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { formatDate } from '../utils/formatters';
import { Users, UserPlus, X, Key, ShieldCheck } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    full_name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
  }>({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'PARTICIPANT',
  });

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

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !formData.password) {
      toastError('Email, username, and password are required.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const created = await adminService.createUser({
        full_name: formData.full_name.trim() || formData.username.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      });
      setUsers((prev) => [created, ...prev]);
      success(`User ${created.full_name || created.username} provisioned successfully with role ${created.role}`);
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        username: '',
        email: '',
        password: '',
        role: 'PARTICIPANT',
      });
    } catch (err: any) {
      toastError(err.message || 'Failed to create user');
    } finally {
      setCreateSubmitting(false);
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
          onChange={(e) => handleRoleChange(row.id || (row as any)._id, e.target.value as UserRole)}
          className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs px-2.5 py-1 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] font-mono cursor-pointer"
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
      {/* Header with Title and Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--accent-red)] uppercase tracking-wider font-mono">
            <Users className="w-3.5 h-3.5 text-[var(--accent-red)]" /> Identity & Access Governance
          </div>
          <h1 className="text-3xl font-black text-[var(--text-main)] font-mono mt-1">User Directory & Roles</h1>
          <p className="text-xs text-[var(--text-muted)] font-sans">
            Manage system privileges, provision users, and assign roles across the platform.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 shrink-0 font-mono text-xs font-bold"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {loading ? (
        <Loading message="Loading user directory..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} fullScreen />
      ) : (
        <Card className="p-0 overflow-hidden theme-card">
          <Table columns={columns} data={users} keyExtractor={(u) => u.id || (u as any)._id || u.username} />
        </Card>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-2xl space-y-4 font-mono">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 text-[var(--text-main)]">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-cyan)]" />
                <h2 className="text-base font-black">Provision New User</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1 font-bold">FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1 font-bold">USERNAME</label>
                  <input
                    type="text"
                    required
                    placeholder="alexm"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--border-hover)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1 font-bold">ROLE</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--border-hover)] cursor-pointer"
                  >
                    <option value="PARTICIPANT">PARTICIPANT</option>
                    <option value="JUDGE">JUDGE</option>
                    <option value="ORGANIZER">ORGANIZER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VISITOR">VISITOR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[var(--text-muted)] mb-1 font-bold">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  placeholder="alex@domain.local"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-[var(--text-muted)] font-bold">PASSWORD</label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="inline-flex items-center gap-1 text-[10px] text-[var(--accent-cyan)] hover:underline cursor-pointer"
                  >
                    <Key className="w-3 h-3" /> Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--border-hover)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-color)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={createSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={createSubmitting}
                  className="font-mono"
                >
                  Provision User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
