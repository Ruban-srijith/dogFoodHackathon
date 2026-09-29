import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Event } from '../types';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badge';
import { Input } from '../components/Input';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { formatDate, formatDaysRemaining } from '../utils/formatters';
import { Search, Calendar, MapPin, ArrowRight, Compass } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
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

  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || e.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Hackathon Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Explore Competitions</h1>
          <p className="text-sm text-slate-400 mt-1">Participate in active hackathons or view archived results</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs w-full sm:w-auto">
            {['ALL', 'ONGOING', 'JUDGING', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  statusFilter === st
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search hackathons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Loading message="Loading hackathons..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEvents} fullScreen />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No Competitions Found"
          description={search ? `No competitions matching "${search}"` : 'No public hackathons currently available.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
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

                <div className="space-y-2 pt-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Timeline: {formatDate(evt.start_date)} – {formatDate(evt.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{evt.location || 'Online / Remote'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300 capitalize">
                      {evt.participation_type === 'both' || !evt.participation_type ? 'Individual + Team' : evt.participation_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  to={`/events/${evt.slug || evt.id}`}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                >
                  View Details & Register <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/gallery">
                  <span className="text-[11px] font-mono text-slate-500 hover:text-slate-300">Gallery →</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
