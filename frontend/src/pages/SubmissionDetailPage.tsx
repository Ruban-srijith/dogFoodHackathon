import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionService } from '../services/submissionService';
import { commentService } from '../services/commentService';
import { voteService } from '../services/voteService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Submission, Comment } from '../types';
import { Button } from '../components/Button';
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

      if (user && sub.event_id) {
        try {
          const myVote = await voteService.getMyVote(sub.event_id);
          if (myVote && myVote.submission_id === id) {
            setVoted(true);
          }
        } catch {
          // Non-fatal: voting status failure should not crash project details
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
    <div className="space-y-10 font-body">
      {/* Header Container with Asymmetric Border & Rotated Stamp */}
      <div className="rounded-[16px] border border-[#334155] border-l-4 border-l-[#A78BFA] bg-[#1E293B] p-8 sm:p-10 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#A78BFA] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#334155] -rotate-1">
                <span>PROJECT // ARCHIVE</span>
              </div>
              <StatusBadge status={submission.status} />
              {submission.track_name && (
                <span className="text-xs font-mono font-semibold text-[#A78BFA] bg-[#0F172A] px-2.5 py-0.5 rounded-[4px] border border-[#334155]">
                  {submission.track_name}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#E2E8F0] tracking-tight">
              {submission.title}
            </h1>
            <p className="text-sm font-medium text-[#94A3B8] font-body">
              Submitted by <span className="text-[#E2E8F0] font-semibold">{submission.team_name}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={voted ? 'secondary' : 'primary'}
              size="md"
              onClick={handleVote}
              leftIcon={<Heart className={`w-4 h-4 ${voted ? 'fill-[#F87171] text-[#F87171]' : ''}`} />}
            >
              {voted ? 'Voted' : 'Vote'} ({submission.vote_count ?? 0})
            </Button>

            {isJudgeOrOrganizer && (
              <Link to={`/judge/submissions/${submission.id}`}>
                <Button variant="outline" size="md" leftIcon={<Gavel className="w-4 h-4 text-[#A78BFA]" />}>
                  Score Project
                </Button>
              </Link>
            )}
          </div>
        </div>

        <p className="text-base text-[#E2E8F0] max-w-3xl leading-relaxed font-body">
          {submission.tagline}
        </p>

        {/* Links row (sharp 4px controls) */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#334155] text-xs font-mono">
          {submission.repo_url && (
            <a
              href={submission.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0F172A] text-[#E2E8F0] border border-[#334155] hover:border-[#A78BFA] transition"
            >
              <Github className="w-4 h-4 text-[#94A3B8]" />
              Source Code
            </a>
          )}
          {submission.demo_url && (
            <a
              href={submission.demo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0F172A] text-[#4ADE80] border border-[#334155] hover:border-[#4ADE80] transition"
            >
              <ExternalLink className="w-4 h-4 text-[#4ADE80]" />
              Live Demonstration
            </a>
          )}
          {submission.video_url && (
            <a
              href={submission.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0F172A] text-[#A78BFA] border border-[#334155] hover:border-[#A78BFA] transition"
            >
              <Video className="w-4 h-4 text-[#A78BFA]" />
              Walkthrough Video
            </a>
          )}
        </div>

        {/* Tech Stack Chips (sharp 4px) */}
        {submission.tech_stack && submission.tech_stack.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-[#94A3B8] font-mono mr-1">Stack:</span>
            {submission.tech_stack.map((t) => (
              <span key={t} className="text-xs font-mono px-2.5 py-1 rounded-[4px] bg-[#0F172A] border border-[#334155] text-[#E2E8F0]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description Content */}
      <div className="rounded-[16px] p-8 space-y-4 bg-[#1E293B] border border-[#334155] shadow-sm">
        <h2 className="text-2xl font-heading font-bold text-[#E2E8F0]">Project Description & Architecture</h2>
        <div className="text-sm text-[#E2E8F0] leading-relaxed whitespace-pre-wrap font-body">
          {submission.description}
        </div>
      </div>

      {/* Comments & Discussion */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-[#E2E8F0] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#A78BFA]" />
            Comments & Feedback ({comments.length})
          </h2>
        </div>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleAddComment} className="p-5 rounded-[16px] bg-[#1E293B] border border-[#334155] space-y-3 shadow-sm">
            <textarea
              rows={3}
              placeholder="Leave thoughtful feedback or ask questions about the project..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full rounded-[4px] bg-[#0F172A] border border-[#334155] p-3 text-sm text-[#E2E8F0] placeholder-[#94A3B8] focus:outline-none focus:border-[#A78BFA] font-body"
              required
            />
            <div className="flex items-center justify-between">
              {isJudgeOrOrganizer ? (
                <label className="flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer font-body">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded-[4px] bg-[#0F172A] border-[#334155] text-[#A78BFA] focus:ring-[#A78BFA]"
                  />
                  <span className="flex items-center gap-1 text-[#A78BFA] font-mono font-semibold">
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
          <div className="rounded-[16px] p-6 text-center text-xs text-[#94A3B8] bg-[#1E293B] border border-[#334155]">
            <Link to="/login" className="text-[#A78BFA] font-semibold hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion and post feedback.
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-[16px] border text-sm transition ${
                c.is_internal
                  ? 'bg-[#1E293B] border-[#A78BFA] text-[#E2E8F0]'
                  : 'bg-[#1E293B] border-[#334155] text-[#E2E8F0]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#E2E8F0]">{c.author_name}</span>
                  <RoleBadge role={c.author_role} />
                  {c.is_internal && (
                    <span className="text-[10px] uppercase font-mono font-bold text-[#A78BFA] px-2 py-0.5 rounded-[4px] bg-[#0F172A] border border-[#A78BFA]">
                      Internal Evaluation Note
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#94A3B8] font-mono">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-xs leading-relaxed font-body text-[#94A3B8]">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
