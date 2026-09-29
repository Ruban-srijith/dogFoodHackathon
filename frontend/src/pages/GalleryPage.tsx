import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { submissionService } from '../services/submissionService';
import { eventService } from '../services/eventService';
import { voteService } from '../services/voteService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Submission, Event } from '../types';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Heart, Github, ExternalLink, Trophy, Layers, ArrowRight, Search, Share2, Check } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event_id');

  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || 'all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [votedSubmissions, setVotedSubmissions] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Events on initial mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const evts = await eventService.getPublicEvents();
        setEvents(evts);
      } catch (err: any) {
        console.error('Failed to load events list:', err);
      }
    };
    loadEvents();
  }, []);

  // Sync eventIdParam with selectedEventId
  useEffect(() => {
    if (eventIdParam && eventIdParam !== selectedEventId) {
      setSelectedEventId(eventIdParam);
    }
  }, [eventIdParam]);

  // Load Submissions when selectedEventId or user changes
  useEffect(() => {
    const loadGallery = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetId = selectedEventId === 'all' ? undefined : selectedEventId;
        const subs = await submissionService.getGallery(targetId);
        setSubmissions(subs);

        if (user && targetId && targetId !== 'all') {
          try {
            const myVote = await voteService.getMyVote(targetId);
            if (myVote) {
              setVotedSubmissions({ [myVote.submission_id]: true });
            }
          } catch {
            // Non-fatal: voting status failure should not crash gallery
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

  const handleEventChange = (newVal: string) => {
    setSelectedEventId(newVal);
    if (newVal === 'all') {
      searchParams.delete('event_id');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ event_id: newVal });
    }
  };

  const handleVote = async (submissionId: string, eventId: string) => {
    if (!user) {
      toastError('Please sign in to vote for projects');
      return;
    }

    try {
      const res = await voteService.castVote(eventId, submissionId);
      setVotedSubmissions((prev) => ({ ...prev, [submissionId]: true }));
      setSubmissions((prev) =>
        prev.map((s) => {
          const sId = s.id || (s as any)._id;
          return sId === submissionId ? { ...s, vote_count: res.currentCount } : s;
        })
      );
      success('Vote recorded successfully!');
    } catch (err: any) {
      toastError(err.message || 'Could not cast vote');
    }
  };

  const handleShare = (subId: string, title: string) => {
    const url = `${window.location.origin}/submissions/${subId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(subId);
    success(`Copied share link for "${title}"!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Real-time client-side search filtering
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase().trim();
    return submissions.filter((s) => {
      const title = s.title?.toLowerCase() || '';
      const tagline = s.tagline?.toLowerCase() || '';
      const desc = s.description?.toLowerCase() || '';
      const team = (s.team_name || (typeof s.team_id === 'object' ? s.team_id?.name : ''))?.toLowerCase() || '';
      const track = (s.track_name || (typeof s.track_id === 'object' ? s.track_id?.name : ''))?.toLowerCase() || '';
      const stack = Array.isArray(s.tech_stack) ? s.tech_stack.join(' ').toLowerCase() : '';
      return (
        title.includes(q) ||
        tagline.includes(q) ||
        desc.includes(q) ||
        team.includes(q) ||
        track.includes(q) ||
        stack.includes(q)
      );
    });
  }, [submissions, searchQuery]);

  return (
    <div className="space-y-8 font-body">
      {/* Distinct Detail: Rotated Stamp & Header with Diagonal Accent */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#334155] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] -rotate-1">
              <Layers className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>SHOWCASE // VERIFIED ENTRIES</span>
            </div>
            <div className="h-3 w-12 diagonal-accent-line opacity-60 hidden sm:block" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            Project Gallery
          </h1>
          <p className="text-sm text-[#94A3B8] font-body mt-1">
            Explore, review, and cast peer votes for submitted hackathon innovations.
          </p>
        </div>

        {/* Hackathon Selection & Keyword Search (Sharp 4px controls) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects, stack, team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-[4px] bg-[#0F172A] border border-[#334155] text-xs text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-[#A78BFA] w-56 sm:w-64 font-body"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider font-mono hidden sm:inline">
              Event:
            </span>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="rounded-[4px] bg-[#0F172A] border border-[#334155] text-xs px-3.5 py-2 text-[#E2E8F0] focus:outline-none focus:border-[#A78BFA] font-body cursor-pointer"
            >
              <option value="all">All Hackathons ({submissions.length})</option>
              {events.map((e) => {
                const eId = e.id || (e as any)._id;
                return (
                  <option key={eId} value={eId}>
                    {e.title}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading message="Loading gallery projects..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setSelectedEventId(selectedEventId)} fullScreen />
      ) : filteredSubmissions.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-[#A78BFA]" />}
          title={searchQuery ? 'No Matching Projects Found' : 'No Projects Submitted Yet for this Hackathon'}
          description={
            searchQuery
              ? `No projects found matching "${searchQuery}". Try a different keyword.`
              : 'Switch to "All Hackathons" in the dropdown or be the first team to submit your project!'
          }
        />
      ) : (
        /* Asymmetric grid: First card is wider on md screens */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((sub, index) => {
            const subId = sub.id || (sub as any)._id;
            const hasVoted = votedSubmissions[subId];
            const teamName = sub.team_name || (typeof sub.team_id === 'object' ? sub.team_id?.name : 'Independent Team');
            const trackName = sub.track_name || (typeof sub.track_id === 'object' ? sub.track_id?.name : 'General Track');

            // Sanitize demo URL so it never throws privacy errors
            let safeDemoUrl = sub.demo_url ? sub.demo_url.trim() : null;
            if (safeDemoUrl && safeDemoUrl.includes('unstop.org')) {
              safeDemoUrl = safeDemoUrl.replace('unstop.org', 'unstop.com');
            }

            const isLeadCard = index === 0;

            return (
              <div
                key={subId}
                className={`rounded-[16px] flex flex-col justify-between h-full p-6 space-y-4 group border border-[#334155] hover:border-[#A78BFA]/50 bg-[#1E293B] shadow-sm transition-colors ${
                  isLeadCard ? 'md:col-span-2 border-l-4 border-l-[#A78BFA]' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#A78BFA] font-semibold px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155]">
                      {trackName}
                    </span>
                    <button
                      onClick={() => handleVote(subId, sub.event_id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-mono font-semibold transition active:scale-95 cursor-pointer ${
                        hasVoted
                          ? 'bg-[#0F172A] text-[#F87171] border border-[#F87171]'
                          : 'bg-[#0F172A] text-[#94A3B8] hover:text-[#F87171] hover:border-[#F87171] border border-[#334155]'
                      }`}
                      title={hasVoted ? 'You voted for this project' : 'Vote for this project'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-[#F87171] text-[#F87171]' : ''}`} />
                      <span>{sub.vote_count ?? 0}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-heading font-bold text-[#E2E8F0] group-hover:text-[#A78BFA] transition-colors">
                      <Link to={`/submissions/${subId}`}>{sub.title}</Link>
                    </h3>
                    <p className="text-xs text-[#94A3B8] font-body mt-1">
                      by <span className="text-[#E2E8F0] font-semibold">{teamName}</span>
                    </p>
                    <p className="text-xs text-[#94A3B8] font-body mt-2.5 line-clamp-2 leading-relaxed">
                      {sub.tagline || sub.description}
                    </p>
                  </div>

                  {sub.tech_stack && sub.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.tech_stack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#0F172A] text-[#E2E8F0] border border-[#334155]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#334155] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {sub.repo_url && (
                      <a
                        href={sub.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#94A3B8] hover:text-[#E2E8F0] transition p-1"
                        title="Source Code Repository"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleShare(subId, sub.title)}
                      className="text-[#94A3B8] hover:text-[#4ADE80] transition p-1 cursor-pointer"
                      title="Share Project Link"
                    >
                      {copiedId === subId ? (
                        <Check className="w-4 h-4 text-[#4ADE80]" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                    {safeDemoUrl && safeDemoUrl.startsWith('http') && !safeDemoUrl.includes('unstop.org') && (
                      <a
                        href={safeDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#94A3B8] hover:text-[#4ADE80] transition p-1"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <Link to={`/submissions/${subId}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Project
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
