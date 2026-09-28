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
import { Search, Calendar, MapPin, ArrowRight } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
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

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Hackathon Directory</h1>
          <p className="text-sm text-slate-400 mt-1">Explore all active, upcoming, and completed hackathons</p>
        </div>

        <div className="w-full md:w-72">
          <Input
            placeholder="Search competitions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {loading ? (
        <Loading message="Loading hackathons..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEvents} fullScreen />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No Hackathons Found"
          description={search ? `No competitions matching "${search}"` : 'No public hackathons available at this time.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
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

                <div className="space-y-1.5 pt-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Timeline: {formatDate(evt.start_date)} – {formatDate(evt.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{evt.location || 'Online / Global'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  to={`/events/${evt.slug || evt.id}`}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  View Details & Register <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to={`/gallery`}>
                  <span className="text-[11px] text-slate-500 hover:text-slate-300">Gallery</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
