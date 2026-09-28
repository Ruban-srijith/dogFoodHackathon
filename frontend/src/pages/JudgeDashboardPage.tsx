import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { judgeService } from '../services/judgeService';
import { JudgeAssignment } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Trophy, CheckCircle, ArrowRight, Gavel } from 'lucide-react';

export const JudgeDashboardPage: React.FC = () => {
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await judgeService.getMyAssignments();
      setAssignments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const completedCount = assignments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Header and Queue Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent-cyan)] uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> Judge Evaluation Queue
          </div>
          <h1 className="text-3xl font-black text-[var(--text-main)] font-mono mt-1">My Assigned Submissions</h1>
          <p className="text-xs text-[var(--text-muted)] font-sans">
            Protected by Strict Judging Isolation. You can only evaluate projects assigned by event organizers.
          </p>
        </div>

        {assignments.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Evaluation Progress</span>
              <span className="font-bold text-[var(--text-main)]">
                {completedCount} of {assignments.length} Completed
              </span>
            </div>
            <div className="w-24 bg-[var(--bg-surface)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
              <div
                className="bg-[var(--accent-green)] h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / assignments.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loading message="Loading your assigned submissions..." fullScreen />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAssignments} fullScreen />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<Gavel className="w-8 h-8 text-[var(--accent-cyan)]" />}
          title="No Submissions Assigned Yet"
          description="You currently have no hackathon submissions assigned for evaluation. Organizers will assign projects once the submission deadline closes."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.id} hover className="flex flex-col justify-between p-6 space-y-4 theme-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={assignment.status} />
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    {assignment.scored_criteria_count ?? 0} criteria scored
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] hover:text-[var(--accent-cyan)] transition-colors font-mono">
                    <Link to={`/judge/submissions/${assignment.submission_id}`}>
                      {assignment.submission_title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">by {assignment.team_name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed font-sans">
                    {assignment.submission_tagline}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  {assignment.status === 'completed' ? (
                    <span className="flex items-center gap-1.5 text-[var(--accent-green)] font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> Scored & Submitted
                    </span>
                  ) : (
                    <span>Ready for evaluation</span>
                  )}
                </div>
                <Link to={`/judge/submissions/${assignment.submission_id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    {assignment.status === 'completed' ? 'Edit Scores' : 'Evaluate Project'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
