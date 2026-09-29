import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { submissionService } from '../services/submissionService';
import { eventService } from '../services/eventService';
import { teamService } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Event, Team } from '../types';
import { Rocket, Save, LogIn, UserPlus, Sparkles } from 'lucide-react';

export const SubmissionCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('event_id') || '';
  const initialTeamId = searchParams.get('team_id') || '';

  const { user, loading: authLoading } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);
  const [event, setEvent] = useState<Event | null>(null);

  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId);
  const [newTeamName, setNewTeamName] = useState<string>('');

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [trackId, setTrackId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all public hackathons
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const evList = await eventService.getPublicEvents();
        setEvents(evList);
        if (!selectedEventId && evList.length > 0) {
          const firstId = evList[0].id || (evList[0] as any)._id || evList[0].slug;
          setSelectedEventId(firstId);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    fetchEvents();
  }, []);

  // 2. Fetch selected event details and tracks
  useEffect(() => {
    if (!selectedEventId) return;
    const fetchEvent = async () => {
      try {
        const ev = await eventService.getEventByIdOrSlug(selectedEventId);
        setEvent(ev);
        if (ev?.tracks && ev.tracks.length > 0) {
          const firstTrk = ev.tracks[0];
          setTrackId(firstTrk.id || (firstTrk as any)._id || '');
        }
      } catch (err) {
        console.error('Failed to load event details:', err);
      }
    };
    fetchEvent();
  }, [selectedEventId]);

  // 3. Fetch user's teams and associate with the event
  useEffect(() => {
    if (!user) return;
    const fetchTeams = async () => {
      try {
        const teams = await teamService.getMyTeams();
        setMyTeams(teams);

        // Find teams matching this event
        const matching = teams.filter((t: any) => {
          const tEventId = String(t.event_id?._id || t.event_id || '');
          const currEventId = String(event?.id || (event as any)?._id || selectedEventId);
          return tEventId === currEventId || tEventId === selectedEventId;
        });

        if (matching.length > 0) {
          const currentValid = matching.some((t: any) => (t.id || t._id) === selectedTeamId);
          if (!currentValid) {
            setSelectedTeamId(matching[0].id || (matching[0] as any)._id);
          }
        } else if (!initialTeamId) {
          setSelectedTeamId('');
        }
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };
    fetchTeams();
  }, [user, selectedEventId, event]);

  const matchingTeams = myTeams.filter((t: any) => {
    const tEventId = String(t.event_id?._id || t.event_id || '');
    const currEventId = String(event?.id || (event as any)?._id || selectedEventId);
    return tEventId === currEventId || tEventId === selectedEventId;
  });

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    if (!title.trim() || !tagline.trim() || !description.trim() || !repoUrl.trim()) {
      setError('Please fill out all required fields (title, tagline, description, repo URL)');
      return;
    }

    let finalTeamId = selectedTeamId;
    if (!finalTeamId) {
      if (!newTeamName.trim()) {
        setError('Please enter your Team Name or select an existing team before submitting.');
        return;
      }
      try {
        const targetEvent = (event as any)?._id || event?.id || selectedEventId;
        const newTeam = await teamService.createTeam({
          event_id: targetEvent,
          name: newTeamName.trim(),
        });
        finalTeamId = newTeam.id || (newTeam as any)._id;
        setSelectedTeamId(finalTeamId);
      } catch (err: any) {
        setError(err.message || 'Failed to auto-register team for submission');
        return;
      }
    }

    setError(null);
    setLoading(true);
    try {
      const tech_stack = techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const targetEvent = (event as any)?._id || event?.id || selectedEventId;

      const sub = await submissionService.createSubmission({
        event_id: targetEvent,
        team_id: finalTeamId,
        track_id: trackId || undefined,
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        repo_url: repoUrl.trim(),
        demo_url: demoUrl.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        tech_stack,
        status,
      });

      const subId = sub.id || (sub as any)._id;
      success(status === 'submitted' ? 'Project submitted successfully!' : 'Draft saved!');
      navigate(`/submissions/${subId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create submission');
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 font-body">
        <div className="rounded-[16px] p-8 text-center space-y-6 border border-[#334155] bg-[#1E293B] shadow-sm">
          <div className="w-16 h-16 rounded-[4px] bg-[#0F172A] border border-[#334155] flex items-center justify-center mx-auto text-[#A78BFA]">
            <LogIn className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-[#E2E8F0]">Participant Login Required</h2>
            <p className="text-[#94A3B8] text-sm max-w-md mx-auto font-body">
              You must be signed in with a participant account to submit a project entry.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              onClick={() => navigate('/login?redirect=/submissions/new')}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In to Continue
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/register')}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Register New Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 font-body">
      <div className="rounded-[16px] p-8 space-y-6 bg-[#1E293B] border border-[#334155] shadow-sm">
        {/* Distinct Detail: Rotated Badge & Header with Accent */}
        <div className="space-y-2 border-b border-[#334155] pb-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] -rotate-1">
              <Rocket className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>ENTRY // PROJECT REGISTRATION</span>
            </div>
            <div className="h-3 w-12 diagonal-accent-line opacity-60 hidden sm:block" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            Submit Your Project
          </h1>
          <p className="text-xs text-[#94A3B8] font-body">
            Share your repository, live demo, and architectural implementation for judging evaluation.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-[4px] bg-[#0F172A] border border-[#F87171] text-[#F87171] text-xs font-mono">
            {error}
          </div>
        )}

        {/* Hackathon Selection & Team Status - Asymmetric Accent Border */}
        <div className="p-4 rounded-[4px] bg-[#0F172A] border border-[#334155] border-l-4 border-l-[#A78BFA] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.length > 0 && (
              <Select
                label="Target Hackathon"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={events.map((ev) => ({
                  value: ev.id || (ev as any)._id || ev.slug,
                  label: ev.title || ev.name || ev.slug,
                }))}
              />
            )}

            {matchingTeams.length > 0 ? (
              <Select
                label="Submitting Team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                options={matchingTeams.map((t: any) => ({
                  value: t.id || t._id,
                  label: `${t.name} (${t.members?.length || 1} members)`,
                }))}
              />
            ) : (
              <Input
                label="Team / Organization Name"
                placeholder="e.g. Apex Builders"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
            )}
          </div>

          {matchingTeams.length === 0 && (
            <div className="p-3 rounded-[4px] bg-[#1E293B] border border-[#334155] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#94A3B8] font-body">
                <Sparkles className="w-4 h-4 shrink-0 text-[#A78BFA]" />
                <span>Entering your team name above will automatically register your team and submit your entry.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/teams/join">
                  <Button size="sm" variant="outline" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                    Join Team via Code
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g. Antigravity Agent Engine"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Short Tagline (1 sentence summary)"
            placeholder="e.g. Autonomous self-correcting development agent with Docker isolation"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            required
          />

          {event?.tracks && event.tracks.length > 0 && (
            <Select
              label="Competition Track"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              options={event.tracks.map((t: any) => ({
                value: t.id || t._id,
                label: `${t.name} ${t.prize_pool ? `(${t.prize_pool})` : ''}`,
              }))}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Source Code Repository URL"
              placeholder="https://github.com/org/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
            <Input
              label="Live Demo URL (optional)"
              placeholder="https://my-demo.example.com"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Video Walkthrough URL (optional)"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <Input
              label="Tech Stack (comma-separated)"
              placeholder="React, TypeScript, Docker, PostgreSQL"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
              Detailed Project Description & Architecture
            </label>
            <textarea
              rows={6}
              placeholder="Explain the problem, technical architecture, innovations, challenges overcome, and future roadmap..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[4px] bg-[#0F172A] border border-[#334155] p-3 text-sm text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-[#A78BFA] font-body"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#334155]">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              isLoading={loading}
              disabled={!selectedTeamId && !newTeamName.trim()}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit('submitted')}
              isLoading={loading}
              disabled={!selectedTeamId && !newTeamName.trim()}
              leftIcon={<Rocket className="w-4 h-4" />}
            >
              Submit Final Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
