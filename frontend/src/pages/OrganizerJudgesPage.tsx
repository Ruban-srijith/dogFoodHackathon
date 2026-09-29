import React, { useEffect, useState } from 'react';
import { judgeService } from '../services/judgeService';
import { eventService } from '../services/eventService';
import { submissionService } from '../services/submissionService';
import { adminService } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import { Event, JudgeAssignment, Submission, User } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table, Column } from '../components/Table';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/Badge';
import { Gavel, UserPlus, Trash2 } from 'lucide-react';

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
      header: 'Submission Title',
      accessor: 'submission_title',
      align: 'left',
      render: (row) => (
        <div>
          <span className="font-bold text-white block">{row.submission_title}</span>
          <span className="text-xs text-slate-400">Team: {row.team_name}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Judge',
      accessor: 'judge_name',
      align: 'left',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-200 block">{row.judge_name}</span>
          <span className="text-xs text-slate-400 font-mono">{row.judge_email}</span>
        </div>
      ),
    },
    {
      header: 'Evaluation Status',
      accessor: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Scored Criteria',
      accessor: 'scored_criteria_count',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs text-emerald-400">
          {row.scored_criteria_count ?? 0} criteria scored
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveAssignment(row.id)}
          className="text-slate-400 hover:text-rose-400 p-1.5"
          title="Remove Assignment"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Gavel className="w-3.5 h-3.5" /> Judge Isolation & Assignments
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Judge Assignments</h1>
          <p className="text-xs text-slate-400">
            Control which judges have access to evaluate specific project submissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedEventId(nextId);
                fetchAssignments(nextId);
              }}
              className="rounded-xl bg-slate-900 border border-slate-800 text-xs px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Assign Judge
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading message="Loading judge assignments..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAll} fullScreen />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<Gavel className="w-8 h-8 text-amber-400" />}
          title="No Judge Assignments"
          description="Click 'Assign Judge' to map evaluator credentials to project submissions."
          actionText="Assign First Judge"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table
            borderless
            columns={columns}
            data={assignments}
            keyExtractor={(a) => a.id}
          />
        </Card>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Judge to Submission"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Select
            label="Select Judge"
            value={selectedJudgeId}
            onChange={(e) => setSelectedJudgeId(e.target.value)}
            options={judges.map((j) => ({ value: j.id, label: `${j.full_name} (${j.email})` }))}
          />

          <Select
            label="Select Submission"
            value={selectedSubmissionId}
            onChange={(e) => setSelectedSubmissionId(e.target.value)}
            options={submissions.map((s) => ({ value: s.id, label: `${s.title} — ${s.team_name || ''}` }))}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={assigning}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
