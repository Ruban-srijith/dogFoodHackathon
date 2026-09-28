import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { submissionService } from '../services/submissionService';
import { eventService } from '../services/eventService';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Card } from '../components/Card';
import { Event } from '../types';
import { Rocket, Save } from 'lucide-react';

export const SubmissionCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id') || '';
  const teamId = searchParams.get('team_id') || '';

  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [trackId, setTrackId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('TypeScript, React, Node.js, PostgreSQL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      try {
        const ev = await eventService.getEventByIdOrSlug(eventId);
        setEvent(ev);
        if (ev.tracks && ev.tracks.length > 0) {
          setTrackId(ev.tracks[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    if (!title.trim() || !tagline.trim() || !description.trim() || !repoUrl.trim()) {
      setError('Please fill out all required fields (title, tagline, description, repo URL)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const tech_stack = techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const sub = await submissionService.createSubmission({
        event_id: eventId,
        team_id: teamId,
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

      success(status === 'submitted' ? 'Project submitted successfully!' : 'Draft saved!');
      navigate(`/submissions/${sub.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card className="p-8 space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Rocket className="w-3.5 h-3.5" /> Project Submission
          </div>
          <h1 className="text-2xl font-bold text-white">Submit Your Project</h1>
          <p className="text-xs text-slate-400">Share your repository, live demo, and architectural implementation</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

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
              options={event.tracks.map((t) => ({ value: t.id, label: `${t.name} (${t.prize_pool || ''})` }))}
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Detailed Project Description & Architecture
            </label>
            <textarea
              rows={6}
              placeholder="Explain the problem, technical architecture, innovations, challenges overcome, and future roadmap..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('draft')}
              isLoading={loading}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit('submitted')}
              isLoading={loading}
              leftIcon={<Rocket className="w-4 h-4" />}
            >
              Submit Final Project
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
