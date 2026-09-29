import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { teamService } from '../services/teamService';
import { submissionService } from '../services/submissionService';
import { eventService } from '../services/eventService';
import { Team, Submission, Event } from '../types';
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
    <div className="space-y-8 animate-in fade-in duration-300 font-body">
      {/* 1. Header & Welcome Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#334155] pb-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-3">
            {/* Custom Technical SVG Shape */}
            <div className="w-5 h-5 rounded-[4px] bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#A78BFA]">
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                <path d="M1 5V1H5M11 1H15V5M15 11V15H11M5 15H1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            </div>

            {/* Rotated Tag/Badge */}
            <div className="transform -rotate-1 select-none">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#A78BFA] text-[#0F172A] font-mono text-[10px] font-bold uppercase tracking-wider">
                ENGINEERING WORKSPACE // ACTIVE
              </span>
            </div>

            {/* Thin Diagonal Line Accent */}
            <div className="hidden sm:flex items-center gap-1 opacity-60">
              <span className="w-1 h-3 bg-[#334155] skew-x-[-25deg]" />
              <span className="w-1 h-3 bg-[#A78BFA] skew-x-[-25deg]" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            Welcome, {user?.full_name || user?.username}!
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Manage your hackathon teams, build project submissions, and track judging status.
          </p>
        </div>

        {/* Primary Action Buttons with Sharp 4px Corners */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
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
            <Button variant="outline" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
              Join Team
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Telemetry Overview Stats - Asymmetric First Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[16px] p-5 bg-[#1E293B] border border-[#334155] border-l-4 border-l-[#A78BFA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">My Teams</span>
            <Users className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-3xl font-bold font-heading text-[#E2E8F0] mt-2">{teams.length}</div>
          <span className="text-[11px] text-[#94A3B8] font-body block mt-1">Active squads enrolled</span>
        </div>

        <div className="rounded-[16px] p-5 bg-[#1E293B] border border-[#334155] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">Submissions</span>
            <FileCode2 className="w-4 h-4 text-[#4ADE80]" />
          </div>
          <div className="text-3xl font-bold font-heading text-[#E2E8F0] mt-2">{submissions.length}</div>
          <span className="text-[11px] text-[#94A3B8] font-body block mt-1">Projects submitted</span>
        </div>

        <div className="rounded-[16px] p-5 bg-[#1E293B] border border-[#334155] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">Open Hackathons</span>
            <Trophy className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-3xl font-bold font-heading text-[#E2E8F0] mt-2">{events.length}</div>
          <span className="text-[11px] text-[#94A3B8] font-body block mt-1">Available competitions</span>
        </div>

        <div className="rounded-[16px] p-5 bg-[#1E293B] border border-[#334155] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">Role Status</span>
            <Layers className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="mt-2.5">
            <span className="font-heading font-bold text-xl text-[#A78BFA] uppercase tracking-wider">{user?.role || 'PARTICIPANT'}</span>
          </div>
          <span className="text-[11px] text-[#4ADE80] font-mono block mt-1">● Active Session</span>
        </div>
      </div>

      {/* 3. My Teams Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-[#E2E8F0] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#A78BFA]" />
              My Enrolled Teams
            </h2>
            <p className="text-xs text-[#94A3B8] font-body mt-0.5">
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
                <div
                  key={team.id}
                  className="rounded-[16px] p-5 bg-[#1E293B] border border-[#334155] flex flex-col justify-between space-y-4 hover:border-[#A78BFA]/50 transition-colors shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-heading font-bold text-[#E2E8F0] leading-tight">{team.name}</h3>
                        <span className="text-xs text-[#94A3B8] font-body block mt-0.5">
                          {(team as any).event_id?.title || 'Hackathon Event'}
                        </span>
                      </div>
                      {leader && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#0F172A] text-[#A78BFA] border border-[#A78BFA]/40 font-semibold shrink-0">
                          Team Lead
                        </span>
                      )}
                    </div>

                    {team.description && (
                      <p className="text-xs text-[#94A3B8] font-body line-clamp-2">{team.description}</p>
                    )}

                    {/* Member Count Badge */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-[#94A3B8] font-mono">
                      <span>Members:</span>
                      <span className="text-[#4ADE80] font-bold">{team.members?.length || 1} / 4</span>
                    </div>

                    {/* Invite Code Quick Copy */}
                    {team.invite_code && (
                      <div className="p-2.5 rounded-[4px] bg-[#0F172A] border border-[#334155] flex items-center justify-between gap-2 text-xs">
                        <div className="truncate">
                          <span className="text-[10px] font-mono text-[#94A3B8] block uppercase">Invite Code</span>
                          <span className="font-mono text-[#E2E8F0] tracking-widest font-bold">{team.invite_code}</span>
                        </div>
                        <button
                          onClick={() => handleCopyInviteCode(team.invite_code)}
                          className="p-1.5 rounded-[4px] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#E2E8F0] transition"
                          title="Copy Code"
                        >
                          {copiedCode === team.invite_code ? (
                            <Check className="w-4 h-4 text-[#4ADE80]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#334155] flex items-center justify-between">
                    <Link
                      to={`/teams/${team.id}`}
                      className="text-xs font-mono text-[#A78BFA] hover:text-[#C4B5FD] flex items-center gap-1 font-semibold"
                    >
                      Team Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. My Submissions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-[#E2E8F0] flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-[#4ADE80]" />
              My Project Submissions
            </h2>
            <p className="text-xs text-[#94A3B8] font-body mt-0.5">
              Projects submitted by your team for evaluation and peer voting.
            </p>
          </div>
          <Link to="/submissions/new" className="text-xs font-mono text-[#4ADE80] hover:underline flex items-center gap-1">
            + Submit Project
          </Link>
        </div>

        {submissions.length === 0 ? (
          <EmptyState
            icon={<FileCode2 className="w-8 h-8 text-[#4ADE80]" />}
            title="No Submissions Yet"
            description="You haven't submitted any projects. Finish building your hackathon solution and submit it before the deadline!"
            actionText="Submit Project"
            onAction={() => (window.location.href = '/submissions/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-[16px] p-5 bg-[#1E293B] border border-[#334155] flex flex-col justify-between space-y-4 hover:border-[#4ADE80]/40 transition-colors shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-[#E2E8F0]">{sub.title}</h3>
                      <span className="text-xs text-[#94A3B8] font-body block mt-0.5">
                        Team: {sub.team_name || 'Independent'} • Track: {sub.track_name || 'General'}
                      </span>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <p className="text-xs text-[#94A3B8] font-body line-clamp-2">{sub.tagline || sub.description}</p>

                  {/* Tech Stack Chips */}
                  {sub.tech_stack && sub.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono bg-[#0F172A] border border-[#334155] text-[#E2E8F0]"
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
                        className="inline-flex items-center gap-1.5 text-[#94A3B8] hover:text-[#E2E8F0]"
                      >
                        <Github className="w-3.5 h-3.5" /> Repository
                      </a>
                    )}
                    {sub.demo_url && (
                      <a
                        href={sub.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#4ADE80] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#334155] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    Votes Received: <strong className="text-[#E2E8F0]">{sub.vote_count || 0}</strong>
                  </span>
                  <Link
                    to={`/submissions/${sub.id}`}
                    className="text-xs font-mono text-[#4ADE80] hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Project <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Available Hackathons Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-[#E2E8F0] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#A78BFA]" />
              Active Hackathons
            </h2>
            <p className="text-xs text-[#94A3B8] font-body mt-0.5">
              Enter exciting hackathons, create teams, and win prizes.
            </p>
          </div>
          <Link to="/events" className="text-xs font-mono text-[#A78BFA] hover:underline flex items-center gap-1">
            Browse All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(0, 3).map((evt) => (
            <div
              key={evt.id}
              className="rounded-[16px] p-5 bg-[#1E293B] border border-[#334155] flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#A78BFA] font-bold uppercase tracking-wider">
                    {evt.status || 'Active'}
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {evt.tracks?.length || 1} Tracks
                  </span>
                </div>
                <h3 className="text-base font-heading font-bold text-[#E2E8F0] leading-snug">{evt.title}</h3>
                <p className="text-xs text-[#94A3B8] font-body line-clamp-2">{evt.description}</p>
              </div>

              <div className="pt-2 border-t border-[#334155] flex items-center justify-between">
                <Link
                  to={`/events/${evt.id || evt.slug}`}
                  className="text-xs font-mono text-[#A78BFA] hover:underline flex items-center gap-1 font-semibold"
                >
                  View Event Rules <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/teams/new">
                  <Button variant="ghost" size="sm" className="text-[11px] px-2.5 py-1">
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
