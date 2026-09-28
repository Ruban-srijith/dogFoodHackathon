import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { submissionService } from '../services/submissionService';
import { eventService } from '../services/eventService';
import { voteService } from '../services/voteService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Submission, Event } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Heart, Github, ExternalLink, Trophy, Layers, ArrowRight } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event_id');

  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votedSubmissions, setVotedSubmissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const evts = await eventService.getPublicEvents();
        setEvents(evts);
        if (!selectedEventId && evts.length > 0) {
          setSelectedEventId(evts[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load events');
      }
    };
    loadEvents();
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId) return;

    const loadGallery = async () => {
      setLoading(true);
      setError(null);
      try {
        const subs = await submissionService.getGallery(selectedEventId);
        setSubmissions(subs);

        if (user) {
          const myVote = await voteService.getMyVote(selectedEventId);
          if (myVote) {
            setVotedSubmissions({ [myVote.submission_id]: true });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load project gallery');
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [selectedEventId, user]);

  const handleVote = async (submissionId: string) => {
    if (!user) {
      toastError('Please sign in to vote for projects');
      return;
    }

    try {
      const res = await voteService.castVote(selectedEventId, submissionId);
      setVotedSubmissions((prev) => ({ ...prev, [submissionId]: true }));
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, vote_count: res.currentCount } : s))
      );
      success('Vote recorded successfully!');
    } catch (err: any) {
      toastError(err.message || 'Could not cast vote');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Public Showcase</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Project Gallery</h1>
          <p className="text-sm text-slate-400 mt-1">Explore, test, and vote for submitted hackathon innovations</p>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Hackathon:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-800 text-xs px-3.5 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 font-medium cursor-pointer"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <Loading message="Loading gallery projects..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setSelectedEventId(selectedEventId)} fullScreen />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-amber-400" />}
          title="No Projects Submitted Yet"
          description="Be the first team to finish and submit your hackathon project!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub) => {
            const hasVoted = votedSubmissions[sub.id];
            return (
              <Card key={sub.id} hover className="flex flex-col justify-between h-full p-6 space-y-4 group border-slate-800/90 hover:border-sky-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                      {sub.track_name || 'General Track'}
                    </span>
                    <button
                      onClick={() => handleVote(sub.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition active:scale-95 ${
                        hasVoted
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                          : 'bg-slate-800/80 text-slate-300 hover:text-rose-400 hover:bg-slate-700/60 border border-slate-700/80'
                      }`}
                      title={hasVoted ? 'You voted for this project' : 'Vote for this project'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{sub.vote_count ?? 0}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-sky-400 transition-colors">
                      <Link to={`/submissions/${sub.id}`}>{sub.title}</Link>
                    </h3>
                    <p className="text-xs text-emerald-400 font-semibold mt-1">by {sub.team_name}</p>
                    <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {sub.tagline}
                    </p>
                  </div>

                  {sub.tech_stack && sub.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.tech_stack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-800"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {sub.repo_url && (
                      <a
                        href={sub.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white transition"
                        title="Repository"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {sub.demo_url && (
                      <a
                        href={sub.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white transition"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <Link to={`/submissions/${sub.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Project
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
