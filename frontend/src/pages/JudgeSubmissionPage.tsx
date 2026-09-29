import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { judgeService, JudgeSubmissionDetailResponse } from '../services/judgeService';
import { scoreService } from '../services/scoreService';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import {
  Github,
  ExternalLink,
  Video,
  Award,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const JudgeSubmissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();

  const [detail, setDetail] = useState<JudgeSubmissionDetailResponse | null>(null);
  const [scores, setScores] = useState<Record<string, { points: number; feedback: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingCriterionId, setSavingCriterionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await judgeService.getSubmissionForJudging(id);
      setDetail(data);

      // Populate existing scores if already scored
      const initialScores: Record<string, { points: number; feedback: string }> = {};
      if (data.existingScores) {
        data.existingScores.forEach((s) => {
          initialScores[s.criterion_id] = {
            points: Number(s.points),
            feedback: s.feedback || '',
          };
        });
      }
      setScores(initialScores);
    } catch (err: any) {
      setError(err.message || 'Access denied or submission not assigned to you');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleScoreChange = (criterionId: string, points: number) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        points,
        feedback: prev[criterionId]?.feedback || '',
      },
    }));
  };

  const handleFeedbackChange = (criterionId: string, feedback: string) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        points: prev[criterionId]?.points ?? 0,
        feedback,
      },
    }));
  };

  const handleSaveScore = async (criterionId: string) => {
    if (!id) return;
    const scoreItem = scores[criterionId];
    if (!scoreItem) return;

    setSavingCriterionId(criterionId);
    try {
      await scoreService.submitScore(id, {
        criterion_id: criterionId,
        points: Number(scoreItem.points),
        feedback: scoreItem.feedback,
      });
      success('Criterion score saved successfully');
    } catch (err: any) {
      toastError(err.message || 'Failed to save score');
    } finally {
      setSavingCriterionId(null);
    }
  };

  if (loading) return <Loading message="Verifying judge assignment & loading rubric..." fullScreen />;
  if (error || !detail) return <ErrorState message={error || 'Evaluation not available'} onRetry={fetchDetail} fullScreen />;

  const { submission, rubric } = detail;

  // Calculate total points awarded
  const totalAwarded = Object.values(scores).reduce((acc, s) => acc + (Number(s.points) || 0), 0);
  const totalMax = rubric?.criteria?.reduce((acc, c) => acc + Number(c.max_points), 0) || 100;

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-body">
      <div>
        <Link
          to="/judge/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#E2E8F0] transition mb-3 font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Evaluation Queue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#334155] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] -rotate-1">
                <Award className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>JUDGING RUBRIC // EVALUATION MATRIX</span>
              </div>
              <div className="h-3 w-12 diagonal-accent-line opacity-60 hidden sm:block" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
              {submission.title}
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1 font-body">
              by <span className="text-[#E2E8F0] font-semibold">{submission.team_name}</span> • {submission.tagline}
            </p>
          </div>

          {/* Asymmetric Cumulative Score Badge */}
          <div className="p-4 rounded-[16px] bg-[#1E293B] border border-[#334155] border-l-4 border-l-[#A78BFA] text-right shrink-0 shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#A78BFA] block font-mono">
              Cumulative Score
            </span>
            <div className="text-3xl font-heading font-bold text-[#E2E8F0] mt-1">
              {totalAwarded} <span className="text-sm font-normal text-[#94A3B8] font-body">/ {totalMax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Deliverables & Summary */}
      <div className="rounded-[16px] p-6 space-y-4 bg-[#1E293B] border border-[#334155] shadow-sm">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A78BFA]">Project Deliverables</h2>
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          {submission.repo_url && (
            <a
              href={submission.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0F172A] text-[#E2E8F0] border border-[#334155] hover:border-[#A78BFA] transition"
            >
              <Github className="w-4 h-4 text-[#94A3B8]" /> Source Code
            </a>
          )}
          {submission.demo_url && (
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0F172A] text-[#E2E8F0] border border-[#334155] hover:border-[#A78BFA] transition"
            >
              <ExternalLink className="w-4 h-4 text-[#4ADE80]" /> Live Demo
            </a>
          )}
          {submission.video_url && (
            <a
              href={submission.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0F172A] text-[#E2E8F0] border border-[#334155] hover:border-[#A78BFA] transition"
            >
              <Video className="w-4 h-4 text-[#A78BFA]" /> Walkthrough Video
            </a>
          )}
        </div>
        <div className="text-xs text-[#E2E8F0] leading-relaxed pt-3 border-t border-[#334155] max-h-40 overflow-y-auto font-body">
          {submission.description}
        </div>
      </div>

      {/* Rubric Evaluation Form */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#A78BFA]" />
          <h2 className="text-2xl font-heading font-bold text-[#E2E8F0]">Scoring Rubric Criteria</h2>
        </div>

        {rubric?.criteria?.map((c) => {
          const scoreData = scores[c.id] || { points: 0, feedback: '' };
          const maxPts = Number(c.max_points);
          const isScored = scoreData.points > 0;

          return (
            <div key={c.id} className="rounded-[16px] p-6 space-y-4 bg-[#1E293B] border border-[#334155] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-3">
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#E2E8F0]">{c.name}</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5 font-body">{c.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-[4px] bg-[#0F172A] text-[#A78BFA] border border-[#334155]">
                    Max {maxPts} Points
                  </span>
                </div>
              </div>

              {/* Score Input Slider & Numeric Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#94A3B8]">Awarded Points</span>
                  <span className={`font-mono font-bold text-base ${isScored ? 'text-[#4ADE80]' : 'text-[#E2E8F0]'}`}>
                    {scoreData.points} / {maxPts}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max={maxPts}
                    step="1"
                    value={scoreData.points}
                    onChange={(e) => handleScoreChange(c.id, Number(e.target.value))}
                    className="w-full accent-[#A78BFA] cursor-pointer h-2 bg-[#0F172A] rounded-[4px]"
                  />
                  <input
                    type="number"
                    min="0"
                    max={maxPts}
                    value={scoreData.points}
                    onChange={(e) => handleScoreChange(c.id, Number(e.target.value))}
                    className="w-16 rounded-[4px] bg-[#0F172A] border border-[#334155] p-1.5 text-center text-sm font-mono text-[#E2E8F0] focus:outline-none focus:border-[#A78BFA]"
                  />
                </div>
              </div>

              {/* Feedback Input */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                  Judges Notes & Constructive Feedback (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder={`Provide insights regarding ${c.name.toLowerCase()}...`}
                  value={scoreData.feedback}
                  onChange={(e) => handleFeedbackChange(c.id, e.target.value)}
                  className="w-full rounded-[4px] bg-[#0F172A] border border-[#334155] p-2.5 text-xs text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-[#A78BFA] font-body"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveScore(c.id)}
                  isLoading={savingCriterionId === c.id}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#0F172A]" />}
                >
                  Save Score
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
