import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamService } from '../services/teamService';
import { submissionService } from '../services/submissionService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Team, Submission } from '../types';
import { Button } from '../components/Button';
import { RoleBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { Users, Copy, Check, PlusCircle, FileText, ArrowUpRight, ShieldCheck, Crown } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.getTeamById(id);
      setTeam(data);

      const eventId = typeof data.event_id === 'string' ? data.event_id : (data.event_id as any)?._id || (data.event_id as any)?.id;
      if (eventId) {
        const eventSubs = await submissionService.getEventSubmissions(eventId);
        const teamSub = eventSubs.find((s) => {
          const subTeamId = typeof s.team_id === 'string' ? s.team_id : (s.team_id as any)?._id || (s.team_id as any)?.id;
          return subTeamId === data.id || subTeamId === (data as any)._id;
        });
        setSubmission(teamSub || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const handleCopyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    success('Invite code copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) return <Loading message="Loading team details..." fullScreen />;
  if (error || !team) return <ErrorState message={error || 'Team not found'} onRetry={fetchTeam} fullScreen />;

  const userIdent = user?.id || (user as any)?._id;
  const isMember = Boolean(
    userIdent && (
      team.members?.some((m: any) => (m.id || m._id) === userIdent) ||
      (typeof team.leader_id === 'string'
        ? team.leader_id === userIdent
        : ((team.leader_id as any)?._id || (team.leader_id as any)?.id) === userIdent)
    )
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Top Meta Bar with Custom SVG Detail & Rotated Stamp */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          {/* Custom Small Technical SVG Shape - Registration Mark */}
          <div className="w-6 h-6 rounded-[4px] bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#A78BFA]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M1 5V1H5M11 1H15V5M15 11V15H11M5 15H1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
            <span className="text-[#A78BFA] font-bold">ROSTER</span>
            <span>/</span>
            <span className="uppercase">{team.name}</span>
          </div>

          {/* Diagonal Accent Line */}
          <div className="hidden sm:flex items-center gap-1 opacity-60">
            <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
            <span className="w-1.5 h-3 bg-[#334155] skew-x-[-25deg]" />
            <span className="w-1.5 h-3 bg-[#A78BFA] skew-x-[-25deg]" />
          </div>
        </div>

        {/* Rotated Tag/Badge - Hand-crafted detail */}
        <div className="transform -rotate-2 select-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#A78BFA] text-[#0F172A] font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
            VERIFIED CONTENDER
          </span>
        </div>
      </div>

      {/* Team Header Section with Grid Break & Overlapping Invite Box */}
      <div className="relative rounded-[16px] border border-[#334155] bg-[#1E293B] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left Title & Manifesto Block */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-[4px] bg-[#0F172A] text-[#A78BFA] border border-[#334155]">
                TEAM #{team.id?.slice(-4) || 'ACTIVE'}
              </span>
              {isMember && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/30">
                  MY SQUAD
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-[#E2E8F0] tracking-tight leading-tight">
              {team.name}
            </h1>

            <p className="text-sm text-[#94A3B8] leading-relaxed max-w-xl pt-1">
              {team.description || 'Focused engineering squad building production-grade solutions.'}
            </p>
          </div>

          {/* Right Section: Overlapping Offset Invite Card (Grid Break) */}
          <div className="lg:-mt-12 lg:-mr-4 relative z-10 self-start sm:self-auto shrink-0 w-full sm:w-auto">
            <div className="rounded-[4px] border-2 border-[#A78BFA] bg-[#0F172A] p-4 sm:p-5 shadow-2xl space-y-3 min-w-[260px]">
              <div className="flex items-center justify-between border-b border-[#334155] pb-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#94A3B8]">
                  TEAM ACCESS KEY
                </span>
                <span className="w-2 h-2 rounded-[1px] bg-[#4ADE80]" />
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#94A3B8] block">INVITE CODE</span>
                <div className="font-mono text-xl sm:text-2xl font-black text-[#A78BFA] tracking-widest select-all">
                  {team.invite_code}
                </div>
              </div>

              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopyCode}
                className="w-full font-mono text-xs uppercase"
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'KEY COPIED' : 'COPY INVITE KEY'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Asymmetric 7:5 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Project Submission Showcase */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-[16px] border border-[#334155] bg-[#1E293B] p-6 space-y-5">
            {/* Header with Sharp Badge */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[4px] bg-[#0F172A] border border-[#334155] flex items-center justify-center text-[#A78BFA]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-heading font-bold text-[#E2E8F0]">PROJECT SUBMISSION</h2>
                  <p className="text-[11px] font-mono text-[#94A3B8]">EVALUATION ASSET & ARTIFACTS</p>
                </div>
              </div>

              {submission && (
                <Link to={`/submissions/${submission.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                    VIEW
                  </Button>
                </Link>
              )}
            </div>

            {submission ? (
              /* Asymmetric Inner Offset Card with Left Solid Stripe */
              <div className="rounded-[4px] border border-[#334155] border-l-4 border-l-[#A78BFA] bg-[#0F172A] p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#A78BFA]">
                      TITLE
                    </span>
                    <h3 className="text-lg font-heading font-bold text-[#E2E8F0]">
                      {submission.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {submission.tagline || 'No tagline provided for this project.'}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-[4px] bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/30">
                    {submission.status}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#334155]/60 text-xs">
                  <span className="text-[#94A3B8] font-mono text-[11px]">
                    REF #{submission.id?.slice(-6)}
                  </span>
                  {isMember && (
                    <Link to={`/submissions/${submission.id}/edit`}>
                      <Button variant="secondary" size="sm" className="font-mono text-xs">
                        EDIT SUBMISSION
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              /* Empty State with Tighter, Architectural Spacing */
              <div className="rounded-[4px] border border-dashed border-[#334155] bg-[#0F172A] p-8 text-center space-y-4">
                <div className="w-10 h-10 mx-auto rounded-[4px] bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8]">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-heading font-bold text-[#E2E8F0]">NO PROJECT SUBMITTED YET</h4>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    This squad has not registered a submission. Submissions are required for judge rubric evaluation.
                  </p>
                </div>
                {isMember && (
                  <div className="pt-2">
                    <Link to={`/submissions/new?event_id=${typeof team.event_id === 'string' ? team.event_id : (team.event_id as any)?._id || (team.event_id as any)?.id || ''}&team_id=${team.id || (team as any)._id}`}>
                      <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                        CREATE SUBMISSION NOW
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Team Roster */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[16px] border border-[#334155] bg-[#1E293B] p-6 space-y-4">
            {/* Roster Header */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[#0F172A] border border-[#334155] flex items-center justify-center text-[#A78BFA]">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-base font-heading font-bold text-[#E2E8F0]">TEAM ROSTER</h2>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#A78BFA]">
                {team.members?.length || 0} MEMBERS
              </span>
            </div>

            {/* Roster Member List with Sharp Rows & Tighter Intentional Spacing */}
            <div className="space-y-2">
              {team.members?.map((m: any, idx: number) => {
                const isLeader = Boolean(
                  (typeof team.leader_id === 'string'
                    ? team.leader_id === (m.id || m._id)
                    : ((team.leader_id as any)?._id || (team.leader_id as any)?.id) === (m.id || m._id)) ||
                  m.member_role === 'leader'
                );

                return (
                  <div
                    key={m.id || m._id || m.username || idx}
                    className="flex items-center justify-between p-3 rounded-[4px] bg-[#0F172A] border border-[#334155] hover:border-[#A78BFA]/40 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#E2E8F0] block">
                          {m.full_name}
                        </span>
                        {isLeader && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-[2px] bg-[#A78BFA] text-[#0F172A]">
                            <Crown className="w-2.5 h-2.5" /> LEADER
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#94A3B8] font-mono block">
                        @{m.username}
                      </span>
                    </div>

                    <RoleBadge role={m.role} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

