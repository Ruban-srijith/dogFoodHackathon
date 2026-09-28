import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService, PlatformStats } from '../services/adminService';
import { eventService } from '../services/eventService';
import { Event } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/Badge';
import {
  BarChart3,
  Calendar,
  Users,
  Trophy,
  Award,
  Gavel,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

export const OrganizerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, eventsData] = await Promise.all([
        adminService.getStats(),
        eventService.getAllEvents(),
      ]);
      setStats(statsData);
      setEvents(eventsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <Loading message="Loading organizer metrics..." fullScreen />;
  if (error || !stats) return <ErrorState message={error || 'Failed to load metrics'} onRetry={fetchDashboardData} fullScreen />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" /> Operations Console
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Organizer Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry across participants, project submissions, and judge assignments
          </p>
        </div>

        <Link to="/organizer/events">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Hackathon
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Participants</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-white">{stats.totalUsers}</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Teams</span>
            <Trophy className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-white">{stats.totalTeams}</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Submissions</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-white">{stats.totalSubmissions}</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Scores Cast</span>
            <Gavel className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-white">{stats.totalScores}</p>
        </Card>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/organizer/events" className="group">
          <Card hover className="p-6 space-y-3 h-full border-slate-800 group-hover:border-indigo-500/40">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition">
              Hackathon Lifecycle
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure event dates, deadlines, rubric criteria, and transition statuses from draft to closed.
            </p>
          </Card>
        </Link>

        <Link to="/organizer/judges" className="group">
          <Card hover className="p-6 space-y-3 h-full border-slate-800 group-hover:border-amber-500/40">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition">
              Judge Assignments
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Distribute submitted projects to qualified judges and maintain isolated evaluation tracks.
            </p>
          </Card>
        </Link>

        <Link to="/organizer/results" className="group">
          <Card hover className="p-6 space-y-3 h-full border-slate-800 group-hover:border-emerald-500/40">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition">
              Scoring & Results
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              View weighted aggregate scores, judge consensus, and finalize official leaderboard rankings.
            </p>
          </Card>
        </Link>
      </div>

      {/* Active Events Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Active & Draft Hackathons</h2>
        <div className="space-y-3">
          {events.map((evt) => (
            <Card key={evt.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-100">{evt.title}</h3>
                  <StatusBadge status={evt.status} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{evt.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/organizer/results?event_id=${evt.id}`}>
                  <Button variant="outline" size="sm">
                    Results
                  </Button>
                </Link>
                <Link to={`/events/${evt.slug || evt.id}`}>
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View
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
