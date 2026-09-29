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

  const [participationType, setParticipationType] = useState<'individual' | 'team' | 'both'>('team');
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);

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
        participation_type: participationType,
        min_team_size: participationType !== 'individual' ? minTeamSize : undefined,
        max_team_size: participationType !== 'individual' ? maxTeamSize : undefined,
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
      align: 'left',
      render: (row) => (
        <div>
          <span className="font-bold text-white block">{row.title}</span>
          <span className="text-xs text-slate-400 font-mono">/{row.slug}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Start – End Dates',
      align: 'center',
      render: (row) => (
        <span className="text-xs text-slate-400 font-mono">
          {formatDate(row.start_date)} – {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      header: 'Transition State',
      align: 'right',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value as EventStatus)}
          className="rounded-lg bg-slate-900 border border-slate-700 text-xs px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer transition hover:border-emerald-500/50"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="ongoing">Ongoing</option>
          <option value="voting">Voting</option>
          <option value="judging">Judging</option>
          <option value="closed">Closed</option>
        </select>
      ),
      className: 'w-48',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" /> Event Orchestration
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Hackathons & Competitions</h1>
          <p className="text-xs text-slate-400">
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
        <Card className="p-0 overflow-hidden">
          <Table borderless columns={columns} data={events} keyExtractor={(e) => e.id} />
        </Card>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Hackathon"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What are the themes and rules of this hackathon?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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

          <div className="space-y-1.5 text-left pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Participation Type
            </label>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-1.5 text-sm text-slate-200 cursor-pointer">
                <input type="radio" checked={participationType === 'individual'} onChange={() => setParticipationType('individual')} className="accent-emerald-500" />
                Individual
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-200 cursor-pointer">
                <input type="radio" checked={participationType === 'team'} onChange={() => setParticipationType('team')} className="accent-emerald-500" />
                Team
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-200 cursor-pointer">
                <input type="radio" checked={participationType === 'both'} onChange={() => setParticipationType('both')} className="accent-emerald-500" />
                Individual & Team
              </label>
            </div>
          </div>

          {participationType !== 'individual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              <Input
                label="Minimum Team Size"
                type="number"
                min={1}
                value={minTeamSize}
                onChange={(e) => setMinTeamSize(parseInt(e.target.value) || 1)}
                required={true}
              />
              <Input
                label="Maximum Team Size"
                type="number"
                min={minTeamSize}
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 4)}
                required={true}
              />
            </div>
          )}

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
