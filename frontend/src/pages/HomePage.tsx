import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Event } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { formatDate, formatDaysRemaining } from '../utils/formatters';
import { Trophy, ShieldCheck, Terminal, ArrowRight, Cpu, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getPublicEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hackathon events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-20 py-4">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-b from-[#0e1626] via-[#0b101c] to-[#080c14] p-8 sm:p-14 text-center ambient-glow shadow-2xl">
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Self-Hostable Hackathon Infrastructure
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Run Deterministic Hackathons On Your Own Infrastructure.
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
            DOGFOOD powers server-side judge isolation, weighted rubric scoring, automated team orchestration, and real-time public project galleries without external cloud vendor lock-in.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/events">
              <Button size="lg" variant="glow" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Hackathons
              </Button>
            </Link>
            <Link to="/gallery">
              <Button size="lg" variant="secondary" leftIcon={<Trophy className="w-4 h-4 text-amber-400" />}>
                Browse Submissions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Active Events */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">Live Competitions</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">Featured Hackathons</h2>
          </div>
          <Link to="/events" className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors">
            View All Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <Loading message="Loading active hackathons..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : events.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-slate-400">No active hackathons currently available.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Card key={evt.id} hover className="flex flex-col justify-between h-full group border-slate-800/90 hover:border-emerald-500/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={evt.status} />
                    <span className="text-xs font-semibold text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {formatDaysRemaining(evt.submission_deadline)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      <Link to={`/events/${evt.slug || evt.id}`}>{evt.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-slate-400">Starts {formatDate(evt.start_date)}</span>
                  <Link to={`/events/${evt.slug || evt.id}`}>
                    <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Architectural Highlights Bento Grid */}
      <section className="space-y-8">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-400">System Blueprint</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">Engineered for Security & Speed</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="space-y-4 border-emerald-500/20 bg-gradient-to-b from-slate-900/80 to-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Strict Judge Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Judges access assigned submissions exclusively via cryptographically verified server-side session tokens, ensuring zero unauthorized evaluation leakage.
            </p>
          </Card>

          {/* Card 2 */}
          <Card className="space-y-4 border-sky-500/20 bg-gradient-to-b from-slate-900/80 to-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Weighted Rubric Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define multi-dimensional scoring rubric criteria with customized weights, producing instant aggregate score computations and leaderboard rankings.
            </p>
          </Card>

          {/* Card 3 */}
          <Card className="space-y-4 border-indigo-500/20 bg-gradient-to-b from-slate-900/80 to-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">100% Docker Native</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full stack deploys with a single command: `docker compose up --build`. Complete control over database, API, and frontend without SaaS fees.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};
