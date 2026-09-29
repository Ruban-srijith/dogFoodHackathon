import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService, PlatformStats } from '../services/adminService';
import { eventService } from '../services/eventService';
import { Event } from '../types';
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
    <div className="space-y-8 font-body">
      {/* Header with Rotated Stamp & Diagonal Accent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#334155] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] -rotate-1">
              <BarChart3 className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>ORGANIZER // OPERATIONS CONSOLE</span>
            </div>
            <div className="h-3 w-12 diagonal-accent-line opacity-60 hidden sm:block" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            Organizer Dashboard
          </h1>
          <p className="text-xs text-[#94A3B8] font-body mt-1">
            Real-time telemetry across participants, project submissions, and judge assignments
          </p>
        </div>

        <Link to="/organizer/events">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Hackathon
          </Button>
        </Link>
      </div>

      {/* KPI Cards - Asymmetric First Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[16px] p-5 space-y-2 bg-[#1E293B] border border-[#334155] border-l-4 border-l-[#A78BFA] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase font-mono">
            <span>Participants</span>
            <Users className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <p className="text-3xl font-heading font-bold text-[#E2E8F0]">{stats.totalUsers}</p>
        </div>

        <div className="rounded-[16px] p-5 space-y-2 bg-[#1E293B] border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase font-mono">
            <span>Teams</span>
            <Trophy className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <p className="text-3xl font-heading font-bold text-[#E2E8F0]">{stats.totalTeams}</p>
        </div>

        <div className="rounded-[16px] p-5 space-y-2 bg-[#1E293B] border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase font-mono">
            <span>Submissions</span>
            <Award className="w-4 h-4 text-[#4ADE80]" />
          </div>
          <p className="text-3xl font-heading font-bold text-[#E2E8F0]">{stats.totalSubmissions}</p>
        </div>

        <div className="rounded-[16px] p-5 space-y-2 bg-[#1E293B] border border-[#334155] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold uppercase font-mono">
            <span>Scores Cast</span>
            <Gavel className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <p className="text-3xl font-heading font-bold text-[#E2E8F0]">{stats.totalScores}</p>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/organizer/events" className="group">
          <div className="rounded-[16px] p-6 space-y-3 h-full bg-[#1E293B] border border-[#334155] group-hover:border-[#A78BFA]/50 transition-colors shadow-sm">
            <div className="w-10 h-10 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#A78BFA] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#E2E8F0] group-hover:text-[#A78BFA] transition">
              Hackathon Lifecycle
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-body">
              Configure event dates, deadlines, rubric criteria, and transition statuses from draft to closed.
            </p>
          </div>
        </Link>

        <Link to="/organizer/judges" className="group">
          <div className="rounded-[16px] p-6 space-y-3 h-full bg-[#1E293B] border border-[#334155] group-hover:border-[#A78BFA]/50 transition-colors shadow-sm">
            <div className="w-10 h-10 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#4ADE80] flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#E2E8F0] group-hover:text-[#4ADE80] transition">
              Judge Assignments
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-body">
              Distribute submitted projects to qualified judges and maintain isolated evaluation tracks.
            </p>
          </div>
        </Link>

        <Link to="/organizer/results" className="group">
          <div className="rounded-[16px] p-6 space-y-3 h-full bg-[#1E293B] border border-[#334155] group-hover:border-[#A78BFA]/50 transition-colors shadow-sm">
            <div className="w-10 h-10 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#A78BFA] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#E2E8F0] group-hover:text-[#A78BFA] transition">
              Scoring & Results
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-body">
              View weighted aggregate scores, judge consensus, and finalize official leaderboard rankings.
            </p>
          </div>
        </Link>
      </div>

      {/* Active Events Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-heading font-bold text-[#E2E8F0]">Active & Draft Hackathons</h2>
        <div className="space-y-3">
          {events.map((evt) => (
            <div key={evt.id} className="rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E293B] border border-[#334155] shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-bold text-lg text-[#E2E8F0]">{evt.title}</h3>
                  <StatusBadge status={evt.status} />
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 font-body">{evt.description}</p>
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
