import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { teamService } from '../services/teamService';
import { submissionService } from '../services/submissionService';
import { eventService } from '../services/eventService';
import { Team, Submission, Event } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  Users,
  FileCode2,
  Trophy,
  Plus,
  UserPlus,
  ExternalLink,
  Github,
  Copy,
  Check,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const ParticipantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userTeams, userSubs, publicEvents] = await Promise.all([
        teamService.getMyTeams(),
        submissionService.getMySubmissions(),
        eventService.getPublicEvents(),
      ]);
      setTeams(userTeams);
      setSubmissions(userSubs);
      setEvents(publicEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to load participant workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Team invite code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading) {
    return <Loading message="Loading your participant workspace..." fullScreen />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} fullScreen />;
  }

  const isLeaderOf = (team: Team) => {
    if (!user) return false;
    const leaderId = typeof team.leader_id === 'string' ? team.leader_id : (team.leader_id as any)?.id || (team.leader_id as any)?._id;
    return leaderId === user.id;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Welcome Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#A78BFA] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
            Participant Engineering Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-mono mt-1">
            Welcome, {user?.full_name || user?.username}!
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
            Manage your hackathon teams, build project submissions, and track judging status.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/submissions/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Submit Project
            </Button>
          </Link>
          <Link to="/teams/new">
            <Button variant="secondary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Create Team
            </Button>
          </Link>
          <Link to="/teams/join">
            <Button variant="ghost" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
              Join Team
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Telemetry Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 theme-card bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">My Teams</span>
            <Users className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{teams.length}</div>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Active squads enrolled</span>
        </Card>

        <Card className="p-4 theme-card bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Submissions</span>
            <FileCode2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{submissions.length}</div>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Projects submitted</span>
        </Card>

        <Card className="p-4 theme-card bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Open Hackathons</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{events.length}</div>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Available competitions</span>
        </Card>

        <Card className="p-4 theme-card bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Role Status</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono mt-2.5">
            <span className="text-[#A78BFA] uppercase tracking-wider text-sm">{user?.role || 'PARTICIPANT'}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-sans block mt-1 font-mono">● Active Session</span>
        </Card>
      </div>

      {/* 3. My Teams Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A78BFA]" />
              My Enrolled Teams
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              Teams you lead or collaborate in. Share your invite code with friends to build together.
            </p>
          </div>
          <Link to="/teams/new" className="text-xs font-mono text-[#A78BFA] hover:underline flex items-center gap-1">
            + New Team
          </Link>
        </div>

        {teams.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-[#A78BFA]" />}
            title="No Teams Yet"
            description="Create your own team or enter an invite code to join a team formed by your teammates."
            actionText="Create Team"
            onAction={() => (window.location.href = '/teams/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const leader = isLeaderOf(team);
              return (
                <Card
                  key={team.id}
                  className="p-5 theme-card bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between space-y-4 hover:border-[#A78BFA]/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-white font-mono leading-tight">{team.name}</h3>
                        <span className="text-[11px] text-slate-400 font-sans block mt-0.5">
                          {(team as any).event_id?.title || 'Hackathon Event'}
                        </span>
                      </div>
                      {leader && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/40 font-semibold shrink-0">
                          Team Lead
                        </span>
                      )}
                    </div>

                    {team.description && (
                      <p className="text-xs text-slate-300 font-sans line-clamp-2">{team.description}</p>
                    )}

                    {/* Member Count Badge */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-400 font-mono">
                      <span>Members:</span>
                      <span className="text-emerald-400 font-bold">{team.members?.length || 1} / 4</span>
                    </div>

                    {/* Invite Code Quick Copy */}
                    {team.invite_code && (
                      <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between gap-2 text-xs">
                        <div className="truncate">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] block uppercase">Invite Code</span>
                          <span className="font-mono text-white tracking-widest font-bold">{team.invite_code}</span>
                        </div>
                        <button
                          onClick={() => handleCopyInviteCode(team.invite_code)}
                          className="p-1.5 rounded-md hover:bg-[var(--bg-card)] text-slate-400 hover:text-white transition"
                          title="Copy Code"
                        >
                          {copiedCode === team.invite_code ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between">
                    <Link
                      to={`/teams/${team.id}`}
                      className="text-xs font-mono text-[#A78BFA] hover:text-[#C4B5FD] flex items-center gap-1 font-semibold"
                    >
                      Team Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. My Submissions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] font-mono flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              My Project Submissions
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              Projects submitted by your team for evaluation and peer voting.
            </p>
          </div>
          <Link to="/submissions/new" className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1">
            + Submit Project
          </Link>
        </div>

        {submissions.length === 0 ? (
          <EmptyState
            icon={<FileCode2 className="w-8 h-8 text-emerald-400" />}
            title="No Submissions Yet"
            description="You haven't submitted any projects. Finish building your hackathon solution and submit it before the deadline!"
            actionText="Submit Project"
            onAction={() => (window.location.href = '/submissions/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => (
              <Card
                key={sub.id}
                className="p-5 theme-card bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono">{sub.title}</h3>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Team: {sub.team_name || 'Independent'} • Track: {sub.track_name || 'General'}
                      </span>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <p className="text-xs text-slate-300 font-sans line-clamp-2">{sub.tagline || sub.description}</p>

                  {/* Tech Stack Chips */}
                  {sub.tech_stack && sub.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Repo and Demo Links */}
                  <div className="flex items-center gap-3 pt-2 text-xs font-mono">
                    {sub.repo_url && (
                      <a
                        href={sub.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
                      >
                        <Github className="w-3.5 h-3.5" /> Repository
                      </a>
                    )}
                    {sub.demo_url && (
                      <a
                        href={sub.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-color)]/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Votes Received: <strong className="text-white">{sub.vote_count || 0}</strong>
                  </span>
                  <Link
                    to={`/submissions/${sub.id}`}
                    className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    View Project <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 5. Available Hackathons Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Active Hackathons
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              Enter exciting hackathons, create teams, and win prizes.
            </p>
          </div>
          <Link to="/events" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
            Browse All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(0, 3).map((evt) => (
            <Card
              key={evt.id}
              className="p-5 theme-card bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    {evt.status || 'Active'}
                  </span>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-mono text-slate-400 border border-slate-700 px-1.5 rounded capitalize">
                      {evt.participation_type === 'both' || !evt.participation_type ? 'Individual + Team' : evt.participation_type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {evt.tracks?.length || 1} Tracks
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white font-mono leading-snug">{evt.title}</h3>
                <p className="text-xs text-slate-300 font-sans line-clamp-2">{evt.description}</p>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between">
                <Link
                  to={`/events/${evt.id || evt.slug}`}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  View Event Rules <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/teams/new">
                  <Button variant="ghost" size="sm" className="text-[11px] px-2.5 py-1">
                    Register
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
