import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionService } from '../services/submissionService';
import { commentService } from '../services/commentService';
import { voteService } from '../services/voteService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Submission, Comment } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge, RoleBadge } from '../components/Badge';
import { Loading } from '../components/Loading';
import { ErrorState } from '../components/ErrorState';
import { formatDate } from '../utils/formatters';
import {
  Github,
  ExternalLink,
  Video,
  Heart,
  MessageSquare,
  Lock,
  Send,
  Gavel,
} from 'lucide-react';

export const SubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const sub = await submissionService.getSubmissionById(id);
      setSubmission(sub);

      const comms = await commentService.getComments(id);
      setComments(comms);

      if (user) {
        const myVote = await voteService.getMyVote(sub.event_id);
        if (myVote && myVote.submission_id === id) {
          setVoted(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [id, user]);

  const handleVote = async () => {
    if (!user || !submission) {
      toastError('Please sign in to vote');
      return;
    }
    try {
      const res = await voteService.castVote(submission.event_id, submission.id);
      setVoted(true);
      setSubmission({ ...submission, vote_count: res.currentCount });
      success('Vote cast successfully!');
    } catch (err: any) {
      toastError(err.message || 'Failed to vote');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;
    setSubmittingComment(true);
    try {
      const newComment = await commentService.createComment(id, commentText, isInternalComment);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      success(isInternalComment ? 'Internal note saved' : 'Comment posted');
    } catch (err: any) {
      toastError(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <Loading message="Loading submission details..." fullScreen />;
  if (error || !submission) return <ErrorState message={error || 'Project not found'} onRetry={fetchSubmission} fullScreen />;

  const isJudgeOrOrganizer = user && ['JUDGE', 'ORGANIZER', 'ADMIN'].includes(user.role);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 sm:p-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <StatusBadge status={submission.status} />
              {submission.track_name && (
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {submission.track_name}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {submission.title}
            </h1>
            <p className="text-sm font-medium text-slate-400">
              Submitted by <span className="text-slate-200">{submission.team_name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={voted ? 'secondary' : 'primary'}
              size="md"
              onClick={handleVote}
              leftIcon={<Heart className={`w-4 h-4 ${voted ? 'fill-rose-400 text-rose-400' : ''}`} />}
            >
              {voted ? 'Voted' : 'Vote'} ({submission.vote_count ?? 0})
            </Button>

            {isJudgeOrOrganizer && (
              <Link to={`/judge/submissions/${submission.id}`}>
                <Button variant="outline" size="md" leftIcon={<Gavel className="w-4 h-4 text-amber-400" />}>
                  Score Project
                </Button>
              </Link>
            )}
          </div>
        </div>

        <p className="text-base text-slate-300 max-w-3xl leading-relaxed">
          {submission.tagline}
        </p>

        {/* Links row */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800 text-xs">
          {submission.repo_url && (
            <a
              href={submission.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              <Github className="w-4 h-4 text-slate-400" />
              Source Code
            </a>
          )}
          {submission.demo_url && (
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              Live Demonstration
            </a>
          )}
          {submission.video_url && (
            <a
              href={submission.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              Walkthrough Video
            </a>
          )}
        </div>

        {/* Tech Stack */}
        {submission.tech_stack && submission.tech_stack.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Technologies:</span>
            {submission.tech_stack.map((t) => (
              <span key={t} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description Content */}
      <Card className="p-8 space-y-4">
        <h2 className="text-xl font-bold text-white">Project Description & Architecture</h2>
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
          {submission.description}
        </div>
      </Card>

      {/* Comments & Discussion */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Comments & Feedback ({comments.length})
          </h2>
        </div>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleAddComment} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <textarea
              rows={3}
              placeholder="Leave thoughtful feedback or ask questions about the project..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
            <div className="flex items-center justify-between">
              {isJudgeOrOrganizer ? (
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Lock className="w-3.5 h-3.5" /> Internal Judge Note (Visible only to Judges/Organizers)
                  </span>
                </label>
              ) : <div />}

              <Button type="submit" variant="primary" size="sm" isLoading={submittingComment} rightIcon={<Send className="w-3.5 h-3.5" />}>
                Post
              </Button>
            </div>
          </form>
        ) : (
          <Card className="text-center py-6 text-xs text-slate-400">
            <Link to="/login" className="text-emerald-400 font-semibold hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion and post feedback.
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border text-sm transition ${
                c.is_internal
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{c.author_name}</span>
                  <RoleBadge role={c.author_role} />
                  {c.is_internal && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Internal Evaluation Note
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-xs leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
