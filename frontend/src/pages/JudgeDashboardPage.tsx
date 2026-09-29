import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { judgeService } from '../services/judgeService';
import { JudgeAssignment } from '../types';
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
    <div className="space-y-8 font-body">
      {/* Header and Queue Progress with Rotated Stamp */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#334155] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] -rotate-1">
              <Trophy className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>JURY // EVALUATION QUEUE</span>
            </div>
            <div className="h-3 w-12 diagonal-accent-line opacity-60 hidden sm:block" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
            My Assigned Submissions
          </h1>
          <p className="text-xs text-[#94A3B8] font-body mt-1">
            Protected by Strict Judging Isolation. You can only evaluate projects assigned by event organizers.
          </p>
        </div>

        {assignments.length > 0 && (
          <div className="p-4 rounded-[16px] bg-[#1E293B] border border-[#334155] border-l-4 border-l-[#A78BFA] flex items-center gap-4 text-xs font-mono shadow-sm">
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">Evaluation Progress</span>
              <span className="font-heading font-bold text-base text-[#E2E8F0]">
                {completedCount} of {assignments.length} Completed
              </span>
            </div>
            <div className="w-24 bg-[#0F172A] rounded-[4px] h-2 overflow-hidden border border-[#334155]">
              <div
                className="bg-[#A78BFA] h-full rounded-[4px] transition-all duration-500"
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
          icon={<Gavel className="w-8 h-8 text-[#A78BFA]" />}
          title="No Submissions Assigned Yet"
          description="You currently have no hackathon submissions assigned for evaluation. Organizers will assign projects once the submission deadline closes."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-[16px] flex flex-col justify-between p-6 space-y-4 bg-[#1E293B] border border-[#334155] hover:border-[#A78BFA]/50 transition-colors shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={assignment.status} />
                  <span className="text-xs text-[#94A3B8] font-mono">
                    {assignment.scored_criteria_count ?? 0} criteria scored
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-heading font-bold text-[#E2E8F0] hover:text-[#A78BFA] transition-colors">
                    <Link to={`/judge/submissions/${assignment.submission_id}`}>
                      {assignment.submission_title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1 font-body">by <span className="text-[#E2E8F0] font-semibold">{assignment.team_name}</span></p>
                  <p className="text-xs text-[#94A3B8] mt-2 line-clamp-2 leading-relaxed font-body">
                    {assignment.submission_tagline}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#334155] flex items-center justify-between">
                <div className="text-xs text-[#94A3B8] font-mono">
                  {assignment.status === 'completed' ? (
                    <span className="flex items-center gap-1.5 text-[#4ADE80] font-semibold">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
