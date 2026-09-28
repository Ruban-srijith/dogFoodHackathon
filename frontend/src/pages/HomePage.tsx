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
import { Trophy, ShieldCheck, Terminal, ArrowRight, Zap, Cpu } from 'lucide-react';

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
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/90 via-dark-900/60 to-dark-950 p-8 sm:p-12 text-center glow-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-sky-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            100% Self-Hostable & Dockerized
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Run World-Class Hackathons On Your Own Infrastructure.
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            DOGFOOD provides deterministic judging isolation, weighted rubric evaluations, team orchestration, and live public galleries without external cloud dependencies.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/events">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Hackathons
              </Button>
            </Link>
            <Link to="/gallery">
              <Button size="lg" variant="outline" leftIcon={<Trophy className="w-4 h-4 text-amber-400" />}>
                Browse Submissions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Active Events */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Featured Hackathons</h2>
            <p className="text-sm text-slate-400">Join active competitions or review submitted projects</p>
          </div>
          <Link to="/events" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <Loading message="Fetching active hackathons..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : events.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-400">No published events currently available.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Card key={evt.id} hover className="flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={evt.status} />
                    <span className="text-xs font-medium text-emerald-400 font-mono">
                      {formatDaysRemaining(evt.submission_deadline)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-100 hover:text-emerald-400 transition-colors">
                      <Link to={`/events/${evt.slug || evt.id}`}>{evt.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Starts: {formatDate(evt.start_date)}</span>
                  <Link to={`/events/${evt.slug || evt.id}`}>
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Architecture Highlights Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Strict Judge Isolation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Judges can only access submissions assigned to them via server-side verified credentials. Frontend tamper-proof security guaranteed.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Weighted Rubric Criteria</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure multi-dimensional evaluation criteria with customizable weights and maximum points, generating instant aggregate rankings.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Zero Cloud Requirement</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Runs seamlessly with a single `docker compose up --build`. No AWS, Firebase, or external API keys needed for core functionality.
          </p>
        </Card>
      </section>
    </div>
  );
};
