import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { teamService } from '../services/teamService';
import { eventService } from '../services/eventService';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Card } from '../components/Card';
import { Event } from '../types';
import { Users } from 'lucide-react';

export const TeamCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event_id') || '';
  const isIndividual = searchParams.get('individual') === 'true';

  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState(eventIdParam);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const evts = await eventService.getPublicEvents();
        setEvents(evts);
        if (!eventId && evts.length > 0) {
          setEventId(evts[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) {
      setError('Please select a hackathon');
      return;
    }
    if (!isIndividual && !name.trim()) {
      setError('Please provide team name');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const team = await teamService.createTeam({
        event_id: eventId,
        name: isIndividual ? 'Solo Participant' : name.trim(),
        description: isIndividual ? undefined : (description.trim() || undefined),
        is_individual: isIndividual,
      });
      const teamId = team.id || (team as any)._id;
      if (isIndividual) {
        success('Registered successfully!');
      } else {
        success(`Team "${team.name}" created!`);
      }
      navigate(`/teams/${teamId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <Card className="p-8 space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> {isIndividual ? 'Individual Registration' : 'Team Registration'}
          </div>
          <h1 className="text-2xl font-bold text-white">{isIndividual ? 'Register Individually' : 'Create a New Team'}</h1>
          <p className="text-xs text-slate-400">{isIndividual ? 'Confirm your individual participation to proceed' : 'Assemble your team and generate an invite code for collaborators'}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {events.length > 0 && (
            <Select
              label="Hackathon Event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              options={events.map((e) => ({ value: e.id, label: e.title }))}
            />
          )}

          {!isIndividual && (
            <>
              <Input
                label="Team Name"
                placeholder="e.g. ByteCraft Innovators"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Team Mission / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What are you building and what technical focus does your team have?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </>
          )}

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            {isIndividual ? 'Register Now' : 'Create Team & Get Invite Code'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
