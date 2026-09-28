import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { judgeService, JudgeSubmissionDetailResponse } from '../services/judgeService';
import { scoreService } from '../services/scoreService';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/Card';
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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Link
          to="/judge/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition mb-3 font-mono"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Evaluation Queue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)] font-mono">{submission.title}</h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
              by <span className="text-[var(--text-main)] font-bold">{submission.team_name}</span> • {submission.tagline}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-right shrink-0 font-mono">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-cyan)] block">
              Cumulative Score
            </span>
            <span className="text-2xl font-black text-[var(--accent-cyan)]">
              {totalAwarded} <span className="text-xs font-normal text-[var(--text-muted)]">/ {totalMax}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Submission Links & Summary */}
      <Card className="p-6 space-y-4 theme-card">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)] font-mono">Project Deliverables</h2>
        <div className="flex flex-wrap gap-4 text-xs font-mono">
          {submission.repo_url && (
            <a
              href={submission.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition"
            >
              <Github className="w-4 h-4" /> Source Code
            </a>
          )}
          {submission.demo_url && (
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition"
            >
              <ExternalLink className="w-4 h-4 text-[var(--accent-cyan)]" /> Live Demo
            </a>
          )}
          {submission.video_url && (
            <a
              href={submission.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition"
            >
              <Video className="w-4 h-4 text-[var(--accent-green)]" /> Walkthrough Video
            </a>
          )}
        </div>
        <div className="text-xs text-[var(--text-main)] leading-relaxed pt-3 border-t border-[var(--border-color)] max-h-40 overflow-y-auto font-sans">
          {submission.description}
        </div>
      </Card>

      {/* Rubric Evaluation Form */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-xl font-black text-[var(--text-main)] font-mono">Scoring Rubric Criteria</h2>
        </div>

        {rubric?.criteria?.map((c) => {
          const scoreData = scores[c.id] || { points: 0, feedback: '' };
          const maxPts = Number(c.max_points);

          return (
            <Card key={c.id} className="p-6 space-y-4 theme-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="font-bold text-base text-[var(--text-main)] font-mono">{c.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 font-sans">{c.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-[var(--bg-surface)] text-[var(--accent-cyan)] border border-[var(--border-color)]">
                    Max {maxPts} Points
                  </span>
                </div>
              </div>

              {/* Score Input Slider & Numeric Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Awarded Points</span>
                  <span className="font-mono font-bold text-base text-[var(--accent-cyan)]">
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
                    className="w-full accent-[var(--accent-cyan)] cursor-pointer h-2 bg-[var(--bg-surface)] rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    max={maxPts}
                    value={scoreData.points}
                    onChange={(e) => handleScoreChange(c.id, Number(e.target.value))}
                    className="w-16 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 text-center text-sm font-mono text-[var(--accent-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
                  />
                </div>
              </div>

              {/* Feedback Input */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                  Judges Notes & Constructive Feedback (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder={`Provide insights regarding ${c.name.toLowerCase()}...`}
                  value={scoreData.feedback}
                  onChange={(e) => handleFeedbackChange(c.id, e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-2.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] font-sans"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSaveScore(c.id)}
                  isLoading={savingCriterionId === c.id}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-green)]" />}
                >
                  Save Score
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
