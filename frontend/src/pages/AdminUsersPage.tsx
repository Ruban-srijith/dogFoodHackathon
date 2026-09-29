import React, { useEffect, useState, useMemo } from 'react';
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
import {
  Users,
  UserPlus,
  X,
  Key,
  ShieldCheck,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
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
      setUsers((prev) => prev.map((u) => (u.id === userId || (u as any)._id === userId ? updated : u)));
      success(`Updated role for ${updated.full_name || updated.username} to ${newRole}`);
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
    setModalError(null);
  };

  const handleOpenModal = () => {
    setModalError(null);
    setFormData({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'PARTICIPANT',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (createSubmitting) return;
    setIsModalOpen(false);
    setModalError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const emailTrim = formData.email.trim().toLowerCase();
    const usernameTrim = formData.username.trim().toLowerCase();
    const fullNameTrim = formData.full_name.trim() || usernameTrim;

    if (!emailTrim || !usernameTrim || !formData.password) {
      const msg = 'Email, username, and password are required.';
      setModalError(msg);
      toastError(msg);
      return;
    }

    if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      const msg = 'Please enter a valid email address.';
      setModalError(msg);
      toastError(msg);
      return;
    }

    if (formData.password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setModalError(msg);
      toastError(msg);
      return;
    }

    setCreateSubmitting(true);
    try {
      const created = await adminService.createUser({
        full_name: fullNameTrim,
        username: usernameTrim,
        email: emailTrim,
        password: formData.password,
        role: formData.role,
      });

      setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id && u.username !== created.username)]);
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
      const errorMsg = err.message || 'Failed to create user. Please try again.';
      setModalError(errorMsg);
      toastError(errorMsg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesRole;
      const matchesSearch =
        (u.full_name && u.full_name.toLowerCase().includes(query)) ||
        (u.username && u.username.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query));
      return matchesRole && matchesSearch;
    });
  }, [users, searchQuery, roleFilter]);

  // Role Breakdown Counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TOTAL: users.length,
      ADMIN: 0,
      ORGANIZER: 0,
      JUDGE: 0,
      PARTICIPANT: 0,
      VISITOR: 0,
    };
    for (const u of users) {
      const r = (u.role || '').toUpperCase();
      if (counts[r] !== undefined) counts[r]++;
    }
    return counts;
  }, [users]);

  const columns: Column<User>[] = [
    {
      header: 'USER',
      accessor: 'full_name',
      align: 'left',
      render: (row) => {
        const displayName = row.full_name || row.username || 'User';
        const initials =
          displayName
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'U';
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-center text-xs font-mono font-bold text-[#A78BFA] shrink-0 select-none">
              {initials}
            </div>
            <div>
              <span className="font-bold text-[#E2E8F0] block font-mono text-xs leading-tight">
                {row.full_name || row.username}
              </span>
              <span className="text-[11px] text-[#94A3B8] font-mono">@{row.username}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'EMAIL ADDRESS',
      accessor: 'email',
      align: 'left',
      className: 'w-64 max-w-[280px]',
      render: (row) => <span className="font-mono text-xs text-[#94A3B8] truncate block">{row.email}</span>,
    },
    {
      header: 'CURRENT ROLE',
      accessor: 'role',
      align: 'center',
      className: 'w-36',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      header: 'CREATED AT',
      align: 'center',
      className: 'w-36',
      render: (row) => <span className="text-xs text-[#94A3B8] font-mono">{formatDate(row.created_at)}</span>,
    },
    {
      header: 'CHANGE ROLE (ADMIN CONTROL)',
      align: 'right',
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row.id || (row as any)._id, e.target.value as UserRole)}
          className="rounded-[4px] bg-[#0F172A] border border-[#334155] text-xs px-3 py-1.5 text-[#E2E8F0] focus:outline-none focus:border-[#A78BFA] font-mono cursor-pointer transition hover:border-[#A78BFA]/60"
        >
          <option value="VISITOR" className="bg-[#1E293B]">VISITOR</option>
          <option value="PARTICIPANT" className="bg-[#1E293B]">PARTICIPANT</option>
          <option value="JUDGE" className="bg-[#1E293B]">JUDGE</option>
          <option value="ORGANIZER" className="bg-[#1E293B]">ORGANIZER</option>
          <option value="ADMIN" className="bg-[#1E293B]">ADMIN</option>
        </select>
      ),
      className: 'w-56',
    },
  ];

  return (
    <div className="space-y-6 font-body">
      {/* Top Header & Distinct Page Accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Distinct Detail: Skewed accent bars + rotated tag */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 opacity-80">
              <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
              <span className="w-1.5 h-3 bg-[#A78BFA] skew-x-[-25deg]" />
            </div>
            <div className="transform -rotate-1 select-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#A78BFA] text-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                ACCESS GOVERNANCE
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            User Directory & Roles
          </h1>
          <p className="text-xs text-[#94A3B8] font-body mt-1">
            Provision new credentials, govern system privileges, and manage role assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUsers}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#94A3B8]" />}
            className="font-mono text-xs rounded-[4px]"
          >
            Refresh
          </Button>
          <Button
            id="admin-add-user-btn"
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            leftIcon={<UserPlus className="w-4 h-4 text-[#0F172A]" />}
            className="font-mono text-xs uppercase font-bold rounded-[4px]"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Asymmetric Metric & Filter Strip (Breaking the Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prominent Wide Tile with Solid Accent Stripe */}
        <div className="rounded-[4px] border border-[#334155] border-l-4 border-l-[#A78BFA] bg-[#1E293B] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#94A3B8] block">
              TOTAL REGISTERED IDENTITIES
            </span>
            <span className="text-2xl font-bold font-mono text-[#E2E8F0]">
              {roleCounts.TOTAL}
            </span>
          </div>
          <div className="w-10 h-10 rounded-[4px] bg-[#0F172A] border border-[#334155] flex items-center justify-center text-[#A78BFA]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Soft Rounded Card with Role Breakdown */}
        <div className="rounded-[16px] border border-[#334155] bg-[#1E293B] p-4 flex flex-col justify-center space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#94A3B8] block">
            ROLE DISTRIBUTION
          </span>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#E2E8F0]">
              <strong className="text-[#A78BFA]">{roleCounts.ADMIN}</strong> Admin
            </span>
            <span className="text-[#94A3B8]">/</span>
            <span className="text-[#E2E8F0]">
              <strong className="text-[#A78BFA]">{roleCounts.ORGANIZER}</strong> Org
            </span>
            <span className="text-[#94A3B8]">/</span>
            <span className="text-[#E2E8F0]">
              <strong className="text-[#4ADE80]">{roleCounts.JUDGE}</strong> Judge
            </span>
            <span className="text-[#94A3B8]">/</span>
            <span className="text-[#E2E8F0]">
              <strong className="text-[#E2E8F0]">{roleCounts.PARTICIPANT}</strong> Part
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-[4px] border border-[#334155] bg-[#0F172A] p-3 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by name, @username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-[4px] bg-[#1E293B] border border-[#334155] text-xs font-mono text-[#E2E8F0] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#A78BFA]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-[4px] bg-[#1E293B] border border-[#334155] text-xs font-mono text-[#E2E8F0] focus:outline-none focus:border-[#A78BFA] cursor-pointer"
          >
            <option value="ALL">ALL ROLES</option>
            <option value="ADMIN">ADMINS</option>
            <option value="ORGANIZER">ORGANIZERS</option>
            <option value="JUDGE">JUDGES</option>
            <option value="PARTICIPANT">PARTICIPANTS</option>
            <option value="VISITOR">VISITORS</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      {loading ? (
        <Loading message="Loading user directory..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} fullScreen />
      ) : (
        <Card className="p-0 overflow-hidden rounded-[16px] border border-[#334155] bg-[#1E293B] shadow-lg">
          <Table
            borderless
            columns={columns}
            data={filteredUsers}
            keyExtractor={(u) => u.id || (u as any)._id || u.username}
            emptyMessage={searchQuery || roleFilter !== 'ALL' ? 'No users match your active filter.' : 'No users found.'}
          />
        </Card>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-md rounded-[16px] border border-[#334155] bg-[#1E293B] p-6 shadow-2xl space-y-4 font-body animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-bold text-[#E2E8F0]">Provision New User</h2>
                  <span className="text-[10px] text-[#94A3B8] font-mono">ADMIN IDENTITY CONSOLE</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={createSubmitting}
                className="text-[#94A3B8] hover:text-[#E2E8F0] p-1 rounded-[4px] hover:bg-[#0F172A] transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inline Error Alert Banner */}
            {modalError && (
              <div className="p-3 rounded-[4px] bg-[#F87171]/15 border border-[#F87171]/40 text-[#F87171] text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F87171]" />
                <span className="leading-snug">{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#94A3B8] uppercase mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                    if (modalError) setModalError(null);
                  }}
                  className="w-full px-3 py-2 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#E2E8F0] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#A78BFA] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#94A3B8] uppercase mb-1">
                    USERNAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="alexm"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (modalError) setModalError(null);
                    }}
                    className="w-full px-3 py-2 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#E2E8F0] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#A78BFA] font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#94A3B8] uppercase mb-1">
                    ROLE
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      setFormData({ ...formData, role: e.target.value as UserRole });
                      if (modalError) setModalError(null);
                    }}
                    className="w-full px-3 py-2 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#E2E8F0] focus:outline-none focus:border-[#A78BFA] font-mono cursor-pointer transition-colors"
                  >
                    <option value="PARTICIPANT" className="bg-[#1E293B]">PARTICIPANT</option>
                    <option value="JUDGE" className="bg-[#1E293B]">JUDGE</option>
                    <option value="ORGANIZER" className="bg-[#1E293B]">ORGANIZER</option>
                    <option value="ADMIN" className="bg-[#1E293B]">ADMIN</option>
                    <option value="VISITOR" className="bg-[#1E293B]">VISITOR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#94A3B8] uppercase mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@domain.local"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (modalError) setModalError(null);
                  }}
                  className="w-full px-3 py-2 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#E2E8F0] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#A78BFA] font-mono transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono font-bold text-[#94A3B8] uppercase">
                    INITIAL PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="inline-flex items-center gap-1 text-[11px] text-[#A78BFA] hover:underline font-mono font-semibold cursor-pointer"
                  >
                    <Key className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (modalError) setModalError(null);
                  }}
                  className="w-full px-3 py-2 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#E2E8F0] placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#A78BFA] font-mono transition-colors"
                />
                <span className="text-[10px] text-[#94A3B8] font-mono mt-1 block">
                  Password will be hashed with bcrypt. User can authenticate immediately.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#334155]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={createSubmitting}
                  className="rounded-[4px] text-xs font-mono"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={createSubmitting}
                  className="rounded-[4px] text-xs font-mono font-bold"
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
