import React, { useEffect, useState } from 'react';
import { judgeService } from '../services/judgeService';
import { eventService } from '../services/eventService';
import { submissionService } from '../services/submissionService';
import { adminService } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import { Event, JudgeAssignment, Submission, User } from '../types';
import { Button } from '../components/Button';
import { Table, Column } from '../components/Table';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/Badge';
import { Gavel, UserPlus, Trash2, Award, FileCheck2, ShieldAlert } from 'lucide-react';

export const OrganizerJudgesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [judges, setJudges] = useState<User[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [evts, judgeUsers] = await Promise.all([
        eventService.getAllEvents(),
        adminService.getUsers('JUDGE'),
      ]);
      setEvents(evts);
      setJudges(judgeUsers);
      const activeEvtId = selectedEventId || (evts.length > 0 ? evts[0].id : '');
      if (activeEvtId) {
        if (!selectedEventId) setSelectedEventId(activeEvtId);
        const [assigns, subs] = await Promise.all([
          judgeService.getEventAssignments(activeEvtId),
          submissionService.getEventSubmissions(activeEvtId),
        ]);
        setAssignments(assigns);
        setSubmissions(subs);
        if (subs.length > 0) setSelectedSubmissionId(subs[0].id);
        if (judgeUsers.length > 0) setSelectedJudgeId(judgeUsers[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize assignment console');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (evtId = selectedEventId) => {
    if (!evtId) return;
    setLoading(true);
    setError(null);
    try {
      const [assigns, subs] = await Promise.all([
        judgeService.getEventAssignments(evtId),
        submissionService.getEventSubmissions(evtId),
      ]);
      setAssignments(assigns);
      setSubmissions(subs);
      if (subs.length > 0) setSelectedSubmissionId(subs[0].id);
      if (judges.length > 0) setSelectedJudgeId(judges[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudgeId || !selectedSubmissionId || !selectedEventId) return;

    setAssigning(true);
    try {
      await judgeService.assignJudge({
        event_id: selectedEventId,
        judge_id: selectedJudgeId,
        submission_id: selectedSubmissionId,
      });
      success('Judge successfully assigned to submission');
      setIsModalOpen(false);
      fetchAssignments();
    } catch (err: any) {
      toastError(err.message || 'Failed to assign judge');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to unassign this judge?')) return;
    try {
      await judgeService.removeAssignment(id);
      success('Assignment removed');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      toastError(err.message || 'Failed to remove assignment');
    }
  };

  const columns: Column<JudgeAssignment>[] = [
    {
      header: 'SUBMISSION TARGET',
      accessor: 'submission_title',
      align: 'left',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-heading font-bold text-[#E2E8F0] block">{row.submission_title}</span>
          <span className="text-[11px] text-[#94A3B8] font-mono">Squad: {row.team_name}</span>
        </div>
      ),
    },
    {
      header: 'ASSIGNED EVALUATOR',
      accessor: 'judge_name',
      align: 'left',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-[#E2E8F0] block text-xs">{row.judge_name}</span>
          <span className="text-[10px] text-[#94A3B8] font-mono">{row.judge_email}</span>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'SCORED CRITERIA',
      accessor: 'scored_criteria_count',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-[#4ADE80] px-2 py-0.5 rounded-[4px] bg-[#4ADE80]/10 border border-[#4ADE80]/30">
          {row.scored_criteria_count ?? 0} criteria
        </span>
      ),
    },
    {
      header: 'ACTIONS',
      align: 'right',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveAssignment(row.id)}
          className="text-[#94A3B8] hover:text-[#F87171] hover:bg-[#F87171]/10 p-1.5 rounded-[4px]"
          title="Remove Assignment"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Distinct Page Accent */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#334155] pb-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-3">
            {/* Custom Technical SVG Shape */}
            <div className="w-5 h-5 rounded-[4px] bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#A78BFA]">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            </div>

            {/* Rotated Tag/Badge */}
            <div className="transform -rotate-1 select-none">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#A78BFA] text-[#0F172A] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                <ShieldAlert className="w-3 h-3 stroke-[2.5]" />
                SECURE CONSOLE // ASSIGNMENT MATRIX
              </span>
            </div>

            {/* Diagonal Line Accent */}
            <div className="hidden sm:flex items-center gap-1 opacity-50">
              <span className="w-1 h-2.5 bg-[#334155] skew-x-[-20deg]" />
              <span className="w-1 h-2.5 bg-[#A78BFA] skew-x-[-20deg]" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            Judge Assignments
          </h1>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Deterministic evaluation routing: map accredited evaluators to candidate project submissions.
          </p>
        </div>

        {/* Action & Filter Toolbar with Sharp 4px Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedEventId(nextId);
                fetchAssignments(nextId);
              }}
              className="rounded-[4px] bg-[#0F172A] border border-[#334155] text-xs font-mono font-medium px-3 py-2 text-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#A78BFA] focus:border-[#A78BFA] cursor-pointer"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id} className="bg-[#1E293B]">
                  EVENT: {e.title}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4 text-[#0F172A]" />}
            className="font-mono text-xs uppercase"
          >
            ASSIGN JUDGE
          </Button>
        </div>
      </div>

      {/* Asymmetric Metric Strip (Breaking the Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Prominent Wide Tile with Solid Accent Stripe */}
        <div className="rounded-[4px] border border-[#334155] border-l-4 border-l-[#A78BFA] bg-[#1E293B] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#94A3B8]">
              ACTIVE ASSIGNMENTS
            </span>
            <div className="font-mono text-2xl font-black text-[#A78BFA]">
              {assignments.length}
            </div>
          </div>
          <Gavel className="w-5 h-5 text-[#A78BFA]/50" />
        </div>

        {/* Secondary Metric Tile */}
        <div className="rounded-[4px] border border-[#334155] bg-[#1E293B] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#94A3B8]">
              REGISTERED JUDGES
            </span>
            <div className="font-mono text-2xl font-black text-[#E2E8F0]">
              {judges.length}
            </div>
          </div>
          <Award className="w-5 h-5 text-[#94A3B8]/40" />
        </div>

        {/* Tertiary Metric Tile */}
        <div className="rounded-[4px] border border-[#334155] bg-[#1E293B] p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#94A3B8]">
              SUBMISSIONS POOL
            </span>
            <div className="font-mono text-2xl font-black text-[#E2E8F0]">
              {submissions.length}
            </div>
          </div>
          <FileCheck2 className="w-5 h-5 text-[#94A3B8]/40" />
        </div>
      </div>

      {/* Main Table Presentation */}
      {loading ? (
        <Loading message="Loading judge assignments..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAll} fullScreen />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<Gavel className="w-8 h-8 text-[#A78BFA]" />}
          title="No Judge Assignments Configured"
          description="Initialize evaluator credentials by mapping judges to candidate projects."
          actionText="Assign First Judge"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="rounded-[16px] border border-[#334155] bg-[#1E293B] overflow-hidden">
          <Table
            borderless
            columns={columns}
            data={assignments}
            keyExtractor={(a) => a.id}
          />
        </div>
      )}

      {/* Assignment Modal with Sharp 4px Inputs */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Judge to Candidate Submission"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 font-sans">
          <Select
            label="SELECT JUDGE"
            value={selectedJudgeId}
            onChange={(e) => setSelectedJudgeId(e.target.value)}
            options={judges.map((j) => ({ value: j.id, label: `${j.full_name} (${j.email})` }))}
          />

          <Select
            label="SELECT TARGET SUBMISSION"
            value={selectedSubmissionId}
            onChange={(e) => setSelectedSubmissionId(e.target.value)}
            options={submissions.map((s) => ({ value: s.id, label: `${s.title} — Team: ${s.team_name || 'Individual'}` }))}
          />

          <div className="pt-3 flex justify-end gap-2 border-t border-[#334155]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              CANCEL
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={assigning}>
              CONFIRM ASSIGNMENT
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

