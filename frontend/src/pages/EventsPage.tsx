import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Event } from '../types';
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
    <div className="space-y-8 font-body">
      {/* Page Header with Rotated Stamp & Diagonal Accent */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#334155] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] -rotate-1">
              <Compass className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>HACKATHONS // 2026 DIRECTORY</span>
            </div>
            <div className="h-3 w-12 diagonal-accent-line opacity-60 hidden sm:block" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            Explore Competitions
          </h1>
          <p className="text-sm text-[#94A3B8] font-body mt-1">
            Participate in active hackathons, form teams, or review past results.
          </p>
        </div>

        {/* Search & Filter Controls (sharp 4px controls) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-[4px] bg-[#0F172A] border border-[#334155] text-xs w-full sm:w-auto font-mono">
            {['ALL', 'ONGOING', 'JUDGING', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1E293B] text-[#A78BFA] border border-[#A78BFA]'
                    : 'text-[#94A3B8] hover:text-[#E2E8F0]'
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
              leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />}
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
          icon={<Compass className="w-8 h-8 text-[#A78BFA]" />}
          title="No Competitions Found"
          description={search ? `No competitions matching "${search}"` : 'No public hackathons currently available.'}
        />
      ) : (
        /* Asymmetric grid: First card is wider on md screens */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt, index) => {
            const isLeadCard = index === 0;

            return (
              <div
                key={evt.id}
                className={`rounded-[16px] flex flex-col justify-between h-full p-6 space-y-4 group border border-[#334155] hover:border-[#A78BFA]/50 bg-[#1E293B] shadow-sm transition-colors ${
                  isLeadCard ? 'md:col-span-2 border-l-4 border-l-[#A78BFA]' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={evt.status} />
                    <span className="text-xs font-semibold text-[#A78BFA] font-mono px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155]">
                      {formatDaysRemaining(evt.submission_deadline)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-heading font-bold text-[#E2E8F0] group-hover:text-[#A78BFA] transition-colors">
                      <Link to={`/events/${evt.slug || evt.id}`}>{evt.title}</Link>
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-2.5 line-clamp-3 leading-relaxed font-body">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-[#94A3B8] font-body">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span>Timeline: {formatDate(evt.start_date)} – {formatDate(evt.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span>{evt.location || 'Online / Remote'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#334155] flex items-center justify-between">
                  <Link
                    to={`/events/${evt.slug || evt.id}`}
                    className="text-xs font-semibold text-[#A78BFA] hover:underline flex items-center gap-1.5 transition-colors font-mono"
                  >
                    View Details & Register <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link to="/gallery">
                    <span className="text-[11px] font-mono text-[#94A3B8] hover:text-[#E2E8F0]">Gallery →</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
