import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { teamService } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { Event, Team } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
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
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="shrink-0 w-full md:w-72 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Participation
              {event.participation_type === 'individual' && <div className="mt-1 text-sm font-bold text-white capitalize">Individual</div>}
              {event.participation_type === 'team' && (
                <div className="mt-1">
                  <div className="text-sm font-bold text-white capitalize">Team</div>
                  <div className="text-xs text-slate-400 normal-case">Team Size: {event.min_team_size || 1} - {event.max_team_size || 4} members</div>
                </div>
              )}
              {(!event.participation_type || event.participation_type === 'both') && (
                <div className="mt-1">
                  <div className="text-sm font-bold text-white capitalize">Individual & Team</div>
                  <div className="text-xs text-slate-400 normal-case">Team Size: {event.min_team_size || 1} - {event.max_team_size || 4} members</div>
                </div>
              )}
            </div>

            {user ? (
              userTeam ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
                    <span className="text-emerald-400 font-semibold block flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> You&apos;re in {userTeam.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] block mt-1">
                      Invite Code: <strong className="text-white">{userTeam.invite_code}</strong>
                    </span>
                  </div>
                  <Link to={`/teams/${userTeam.id}`} className="block">
                    <Button variant="secondary" size="sm" className="w-full">
                      View My Team
                    </Button>
                  </Link>
                  <Link to={`/submissions/new?event_id=${event.id}&team_id=${userTeam.id}`} className="block">
                    <Button variant="primary" size="sm" className="w-full">
                      Submit Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(!event.participation_type || event.participation_type === 'both' || event.participation_type === 'individual') && (
                    <Link to={`/teams/new?event_id=${event.id}&individual=true`} className="block">
                      <Button variant="primary" size="sm" className="w-full" leftIcon={<PlusCircle className="w-4 h-4" />}>
                        Register Individually
                      </Button>
                    </Link>
                  )}
                  {(!event.participation_type || event.participation_type === 'both' || event.participation_type === 'team') && (
                    <>
                      <Link to={`/teams/new?event_id=${event.id}`} className="block">
                        <Button variant={event.participation_type === 'team' ? 'primary' : 'outline'} size="sm" className="w-full" leftIcon={<PlusCircle className="w-4 h-4" />}>
                          Create Team
                        </Button>
                      </Link>
                      <Link to={`/teams/join`} className="block">
                        <Button variant="outline" size="sm" className="w-full" leftIcon={<LogIn className="w-4 h-4" />}>
                          Join Team with Code
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Sign in to create or join a team for this hackathon.</p>
                <Link to="/login" className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    Sign In to Join
                  </Button>
                </Link>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
              <Link to={`/gallery?event_id=${event.id}`} className="text-sky-400 hover:underline">
                View Project Gallery
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
    </div>
  );
};
