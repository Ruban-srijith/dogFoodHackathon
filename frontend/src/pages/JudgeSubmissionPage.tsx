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
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Evaluation Queue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">{submission.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              by <span className="text-slate-200">{submission.team_name}</span> • {submission.tagline}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
              Cumulative Score
            </span>
            <span className="text-2xl font-mono font-black text-amber-300">
              {totalAwarded} <span className="text-xs font-normal text-slate-400">/ {totalMax}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Submission Links & Summary */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Project Deliverables</h2>
        <div className="flex flex-wrap gap-4 text-xs">
          {submission.repo_url && (
            <a
              href={submission.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              <Github className="w-4 h-4" /> Source Code
            </a>
          )}
          {submission.demo_url && (
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" /> Live Demo
            </a>
          )}
          {submission.video_url && (
            <a
              href={submission.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              <Video className="w-4 h-4 text-emerald-400" /> Walkthrough Video
            </a>
          )}
        </div>
        <div className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80 max-h-40 overflow-y-auto">
          {submission.description}
        </div>
      </Card>

      {/* Rubric Evaluation Form */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Scoring Rubric Criteria</h2>
        </div>

        {rubric?.criteria?.map((c) => {
          const scoreData = scores[c.id] || { points: 0, feedback: '' };
          const maxPts = Number(c.max_points);

          return (
            <Card key={c.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-100">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Max {maxPts} Points
                  </span>
                </div>
              </div>

              {/* Score Input Slider & Numeric Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Awarded Points</span>
                  <span className="font-mono font-bold text-base text-emerald-400">
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
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    max={maxPts}
                    value={scoreData.points}
                    onChange={(e) => handleScoreChange(c.id, Number(e.target.value))}
                    className="w-16 rounded-lg bg-slate-900 border border-slate-800 p-1.5 text-center text-sm font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Feedback Input */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Judges Notes & Constructive Feedback (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder={`Provide insights regarding ${c.name.toLowerCase()}...`}
                  value={scoreData.feedback}
                  onChange={(e) => handleFeedbackChange(c.id, e.target.value)}
                  className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSaveScore(c.id)}
                  isLoading={savingCriterionId === c.id}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
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
