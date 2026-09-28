import React, { useEffect, useState } from 'react';
import { eventService } from '../services/eventService';
import { useToast } from '../contexts/ToastContext';
import { Event, EventStatus } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table, Column } from '../components/Table';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/Badge';
import { formatDate } from '../utils/formatters';
import { Calendar, PlusCircle } from 'lucide-react';

export const OrganizerEventsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleStatusChange = async (eventId: string, status: EventStatus) => {
    try {
      const updated = await eventService.updateEvent(eventId, { status });
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
      success(`Event status transitioned to "${status}"`);
    } catch (err: any) {
      toastError(err.message || 'Failed to update status');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !description || !startDate || !endDate || !deadline) return;

    setCreating(true);
    try {
      const newEvt = await eventService.createEvent({
        title,
        slug,
        description,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        submission_deadline: new Date(deadline).toISOString(),
        status: 'published',
      });
      success(`Event "${newEvt.title}" created with default rubric criteria!`);
      setIsModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      toastError(err.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<Event>[] = [
    {
      header: 'Title & Slug',
      accessor: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-[var(--text-main)] block font-mono">{row.title}</span>
          <span className="text-xs text-[var(--text-muted)] font-mono">/{row.slug}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Start – End Dates',
      render: (row) => (
        <span className="text-xs text-[var(--text-muted)] font-mono">
          {formatDate(row.start_date)} – {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      header: 'Transition State',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value as EventStatus)}
          className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs px-2.5 py-1 text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] font-mono"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="ongoing">Ongoing</option>
          <option value="voting">Voting</option>
          <option value="judging">Judging</option>
          <option value="closed">Closed</option>
        </select>
      ),
      className: 'w-40',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 text-xs font-mono tracking-widest text-[var(--text-muted)] border-b border-[var(--border-color)] pb-2 mb-2">
            <span className="text-[var(--accent-cyan)] font-bold">[ UNIT / ORG-02 ]</span>
            <span>SEC_LEVEL_01</span>
            <span className="text-[var(--accent-green)] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-ping" /> ORCHESTRATOR ONLINE
            </span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent-cyan)] uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> Event Orchestration
          </div>
          <h1 className="text-3xl font-black text-[var(--text-main)] font-mono mt-1">Hackathons & Competitions</h1>
          <p className="text-xs text-[var(--text-muted)] font-sans">
            Create competitions, configure evaluation phases, and control state transitions
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Create Hackathon
        </Button>
      </div>

      {loading ? (
        <Loading message="Loading hackathons..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEvents} fullScreen />
      ) : (
        <Card className="p-0 overflow-hidden theme-card">
          <Table columns={columns} data={events} keyExtractor={(e) => e.id} />
        </Card>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Hackathon"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 font-mono">
          <Input
            label="Event Title"
            placeholder="e.g. Next-Gen Agent Hackathon 2026"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
            }}
            required
          />

          <Input
            label="Slug (URL identifier)"
            placeholder="e.g. next-gen-agents-2026"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] font-mono">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What are the themes and rules of this hackathon?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Submission Deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={creating}>
              Create Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
