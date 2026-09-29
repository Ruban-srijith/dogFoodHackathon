import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teamService } from '../services/teamService';
import { submissionService } from '../services/submissionService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Team, Submission } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RoleBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { Users, Copy, Check, PlusCircle, FileText, ArrowRight, Trash2 } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const isLeader = Boolean(
    userIdent && (
      (typeof team.leader_id === 'string'
        ? team.leader_id === userIdent
        : ((team.leader_id as any)?._id || (team.leader_id as any)?.id) === userIdent)
    )
  );
  const isMember = Boolean(
    userIdent && (
      team.members?.some((m: any) => (m.id || m._id) === userIdent) || isLeader
    )
  );

  const handleDeleteTeam = async () => {
    if (!team || !window.confirm("Are you sure you want to delete this team? This action cannot be undone and will also delete any associated project submissions.")) return;
    setDeleting(true);
    try {
      await teamService.deleteTeam(team.id || (team as any)._id);
      success("Team deleted successfully.");
      navigate('/dashboard');
    } catch (err: any) {
      toastError(err.message || 'Failed to delete team');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Team Header */}
      <div className="p-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
              <Users className="w-3.5 h-3.5" /> Hackathon Team
            </div>
            <h1 className="text-3xl font-extrabold text-white">{team.name}</h1>
          </div>

          {/* Invite Code Box & Delete */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Invite Code
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wider">
                  {team.invite_code || 'Hidden'}
                </span>
              </div>
              {team.invite_code && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </div>

            {isLeader && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                onClick={handleDeleteTeam}
                disabled={deleting}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {deleting ? 'Deleting...' : 'Delete Team'}
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {team.description || 'Dedicated to shipping functional innovations.'}
        </p>
      </div>

      {/* Team Project Submission */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Project Submission</h2>
          </div>
          {submission && (
            <Link to={`/submissions/${submission.id}`}>
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Submission
              </Button>
            </Link>
          )}
        </div>

        {submission ? (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-200">{submission.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{submission.tagline}</p>
              <div className="mt-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Status: {submission.status}
                </span>
              </div>
            </div>
            {isMember && (
              <Link to={`/submissions/${submission.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-slate-400">No submission created for this team yet.</p>
            {isMember && (
              <Link to={`/submissions/new?event_id=${typeof team.event_id === 'string' ? team.event_id : (team.event_id as any)?._id || (team.event_id as any)?.id || ''}&team_id=${team.id || (team as any)._id}`}>
                <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Project Submission
                </Button>
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* Team Members */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          Roster ({team.members?.length || 0})
        </h2>

        <div className="divide-y divide-slate-800/80">
          {team.members?.map((m: any, idx: number) => (
            <div key={m.id || m._id || m.username || idx} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-200 block">{m.full_name}</span>
                <span className="text-xs text-slate-400 font-mono">@{m.username}</span>
              </div>
              <div className="flex items-center gap-2">
                {((typeof team.leader_id === 'string'
                  ? team.leader_id === (m.id || m._id)
                  : ((team.leader_id as any)?._id || (team.leader_id as any)?.id) === (m.id || m._id)) ||
                  m.member_role === 'leader') && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Leader
                  </span>
                )}
                <RoleBadge role={m.role} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
