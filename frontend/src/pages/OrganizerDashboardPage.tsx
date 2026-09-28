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
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent-cyan)] uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> Operations Console
          </div>
          <h1 className="text-3xl font-black text-[var(--text-main)] font-mono mt-1">Organizer Dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] font-sans">
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
        <Card className="p-5 space-y-2 theme-card">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold uppercase font-mono">
            <span>Participants</span>
            <Users className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <p className="text-3xl font-black font-mono text-[var(--text-main)]">{stats.totalUsers}</p>
        </Card>

        <Card className="p-5 space-y-2 theme-card">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold uppercase font-mono">
            <span>Teams</span>
            <Trophy className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <p className="text-3xl font-black font-mono text-[var(--text-main)]">{stats.totalTeams}</p>
        </Card>

        <Card className="p-5 space-y-2 theme-card">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold uppercase font-mono">
            <span>Submissions</span>
            <Award className="w-4 h-4 text-[var(--accent-green)]" />
          </div>
          <p className="text-3xl font-black font-mono text-[var(--text-main)]">{stats.totalSubmissions}</p>
        </Card>

        <Card className="p-5 space-y-2 theme-card">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold uppercase font-mono">
            <span>Scores Cast</span>
            <Gavel className="w-4 h-4 text-[var(--accent-red)]" />
          </div>
          <p className="text-3xl font-black font-mono text-[var(--text-main)]">{stats.totalScores}</p>
        </Card>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/organizer/events" className="group">
          <Card hover className="p-6 space-y-3 h-full theme-card border-[var(--border-color)] group-hover:border-[var(--border-hover)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--accent-cyan)] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[var(--text-main)] font-mono group-hover:text-[var(--accent-cyan)] transition">
              Hackathon Lifecycle
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Configure event dates, deadlines, rubric criteria, and transition statuses from draft to closed.
            </p>
          </Card>
        </Link>

        <Link to="/organizer/judges" className="group">
          <Card hover className="p-6 space-y-3 h-full theme-card border-[var(--border-color)] group-hover:border-[var(--border-hover)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--accent-green)] flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[var(--text-main)] font-mono group-hover:text-[var(--accent-green)] transition">
              Judge Assignments
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Distribute submitted projects to qualified judges and maintain isolated evaluation tracks.
            </p>
          </Card>
        </Link>

        <Link to="/organizer/results" className="group">
          <Card hover className="p-6 space-y-3 h-full theme-card border-[var(--border-color)] group-hover:border-[var(--border-hover)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--accent-red)] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[var(--text-main)] font-mono group-hover:text-[var(--accent-red)] transition">
              Scoring & Results
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              View weighted aggregate scores, judge consensus, and finalize official leaderboard rankings.
            </p>
          </Card>
        </Link>
      </div>

      {/* Active Events Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-[var(--text-main)] font-mono">Active & Draft Hackathons</h2>
        <div className="space-y-3">
          {events.map((evt) => (
            <Card key={evt.id} className="p-5 flex items-center justify-between gap-4 theme-card">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[var(--text-main)] font-mono">{evt.title}</h3>
                  <StatusBadge status={evt.status} />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">{evt.description}</p>
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
