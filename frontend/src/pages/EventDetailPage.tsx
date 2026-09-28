import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { teamService } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { Event, Team } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { RegistrationModal } from '../components/RegistrationModal';
import { formatDate, formatDateTime } from '../utils/formatters';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Award,
  PlusCircle,
  LogIn,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const eventData = await eventService.getEventByIdOrSlug(id);
      setEvent(eventData);

      const teamsData = await teamService.getTeamsForEvent(eventData.id);
      setTeams(teamsData);

      if (user) {
        const myTeam = await teamService.getMyTeamInEvent(eventData.id);
        setUserTeam(myTeam);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, user]);

  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setIsRegisterModalOpen(true);
    }
  }, [searchParams]);

  if (loading) return <Loading message="Loading event details..." fullScreen />;
  if (error || !event) return <ErrorState message={error || 'Event not found'} onRetry={fetchDetails} fullScreen />;

  return (
    <div className="space-y-12">
      {/* Event Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <StatusBadge status={event.status} />
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {event.location || 'Online / Global'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {event.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Starts: {formatDate(event.start_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Submission Deadline: {formatDateTime(event.submission_deadline)}</span>
              </div>
            </div>
          </div>

          {/* Action Callout Card */}
          <div className="shrink-0 w-full md:w-80 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Participation Status
              </span>
              {userTeam && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REGISTERED
                </span>
              )}
            </div>

            {user ? (
              userTeam ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> You&apos;re enrolled in {userTeam.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] block mt-1">
                      Invite Code: <strong className="text-white font-bold">{userTeam.invite_code}</strong>
                    </span>
                  </div>
                  <Link to={`/teams/${userTeam.id}`} className="block">
                    <Button variant="secondary" size="sm" className="w-full justify-center">
                      View My Team
                    </Button>
                  </Link>
                  <Link to={`/submissions/new?event_id=${event.id}&team_id=${userTeam.id}`} className="block">
                    <Button variant="primary" size="sm" className="w-full justify-center font-extrabold">
                      Submit Project 🚀
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center font-extrabold py-2.5 text-xs tracking-wide"
                    leftIcon={<Sparkles className="w-4 h-4 text-emerald-300" />}
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    Register For Hackathon 🚀
                  </Button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to={`/teams/new?event_id=${event.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full justify-center text-[11px]" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                        Create Team
                      </Button>
                    </Link>
                    <Link to={`/teams/join`} className="block">
                      <Button variant="outline" size="sm" className="w-full justify-center text-[11px]" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                        Join Code
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center font-extrabold py-2.5"
                  leftIcon={<Sparkles className="w-4 h-4 text-emerald-300" />}
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  Register For Hackathon 🚀
                </Button>
                <p className="text-[11px] text-slate-400 text-center">
                  Sign in or register an account to join team or submit code.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-mono">
              <Link to={`/gallery?event_id=${event.id}`} className="text-sky-400 hover:underline">
                Gallery
              </Link>
              <Link to={`/leaderboard?event_id=${event.id}`} className="text-amber-400 hover:underline">
                Rankings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks & Prizes */}
      {event.tracks && event.tracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Competition Tracks & Prizes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {event.tracks.map((track) => (
              <Card key={track.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100">{track.name}</h3>
                  {track.prize_pool && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {track.prize_pool}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {track.description || 'General track submission category.'}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Evaluation Rubric Breakdown */}
      {event.rubric && event.rubric.criteria && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Evaluation Rubric & Judging Criteria</h2>
          </div>
          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {event.rubric.criteria.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{c.name}</span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                      Max {c.max_points} pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Registered Teams */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white">Enrolled Teams ({teams.length})</h2>
          </div>
        </div>

        {teams.length === 0 ? (
          <p className="text-xs text-slate-400">No teams registered yet. Be the first to register!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map((t) => (
              <Card key={t.id} hover className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-200">{t.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description || 'Hackathon team'}</p>
                </div>
                <Link to={`/teams/${t.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Interactive Registration Modal */}
      <RegistrationModal
        event={event}
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={fetchDetails}
      />
    </div>
  );
};
