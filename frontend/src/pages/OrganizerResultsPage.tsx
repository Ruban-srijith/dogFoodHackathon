import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { scoreService, EventResultsItem } from '../services/scoreService';
import { eventService } from '../services/eventService';
import { Event } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table, Column } from '../components/Table';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Award, Trophy, RefreshCw } from 'lucide-react';

export const OrganizerResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('event_id') || '';

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(eventIdParam);
  const [results, setResults] = useState<EventResultsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAllEvents();
        setEvents(data);
        if (!selectedEventId && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, [selectedEventId]);

  const fetchResults = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await scoreService.getEventResults(selectedEventId);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch aggregate evaluation scores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedEventId]);

  const columns: Column<EventResultsItem>[] = [
    {
      header: 'Rank',
      render: (_row: EventResultsItem) => {
        const rank = results.indexOf(_row) + 1;
        return (
          <div className="flex items-center gap-2">
            {rank === 1 && <Trophy className="w-4 h-4 text-amber-400" />}
            {rank === 2 && <Trophy className="w-4 h-4 text-slate-300" />}
            {rank === 3 && <Trophy className="w-4 h-4 text-amber-600" />}
            <span className="font-mono font-bold text-slate-200">#{rank}</span>
          </div>
        );
      },
      className: 'w-20',
    },
    {
      header: 'Submission Title',
      accessor: 'submission_title',
      render: (row) => <span className="font-bold text-white">{row.submission_title}</span>,
    },
    {
      header: 'Team',
      accessor: 'team_name',
      render: (row) => <span className="text-slate-300">{row.team_name}</span>,
    },
    {
      header: 'Track',
      accessor: 'track_name',
      render: (row) => (
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          {row.track_name || 'General'}
        </span>
      ),
    },
    {
      header: 'Judges Evaluated',
      accessor: 'total_judges_scored',
      render: (row) => (
        <span className="text-slate-400 font-mono">
          {row.total_judges_scored} {row.total_judges_scored === 1 ? 'judge' : 'judges'}
        </span>
      ),
    },
    {
      header: 'Aggregate Weighted Score',
      accessor: 'avg_score',
      render: (row) => (
        <span className="font-mono font-extrabold text-base text-amber-400">
          {row.avg_score} <span className="text-xs font-normal text-slate-500">pts</span>
        </span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Aggregate Standings
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">Scoring & Leaderboard</h1>
          <p className="text-xs text-slate-400">
            Real-time aggregate calculations computed from isolated judge evaluations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-800 text-xs px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          )}

          <Button variant="outline" size="sm" onClick={fetchResults} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading message="Calculating aggregate scores..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchResults} fullScreen />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Award className="w-8 h-8 text-amber-400" />}
          title="No Scored Submissions Yet"
          description="Scores submitted by assigned judges will automatically populate and compute aggregate rankings here."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table
            columns={columns}
            data={results}
            keyExtractor={(r) => r.submission_id}
          />
        </Card>
      )}
    </div>
  );
};
