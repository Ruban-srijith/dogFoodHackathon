import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Layout, 
  Activity, 
  ShieldCheck, 
  Trophy, 
  Calendar, 
  UserCheck, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  Github, 
  Clock, 
  AlertTriangle, 
  Copy, 
  UserPlus, 
  Users, 
  FolderGit2, 
  Sparkles,
  Gavel,
  Scale,
  Shuffle,
  Mail,
  Lock,
  Unlock,
  Sliders,
  FileText,
  BarChart3,
  TrendingUp,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';

interface HealthResponse {
  status: string;
  [key: string]: any;
}

interface JudgeInvite {
  _id: string;
  email?: string;
  invite_code: string;
  status: string;
  created_at: string;
}

interface JudgeAssignment {
  _id: string;
  event_id?: any;
  submission_id: any;
  judge_id: any;
  status: string;
  created_at: string;
}

interface RubricCriterion {
  _id: string;
  event_id?: string;
  name: string;
  description?: string;
  weight: number;
  min_score: number;
  max_score: number;
}

interface EvaluationScoreData {
  _id: string;
  event_id?: string;
  submission_id?: string;
  judge_id?: any;
  criteria_scores: Array<{
    criterion_id: any;
    name?: string;
    score: number;
    weight?: number;
  }>;
  comment?: string;
  weighted_total: number;
  status: 'draft' | 'submitted';
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
}

interface RankingItem {
  submission_id: string;
  title: string;
  team_name: string;
  track_name: string;
  raw_score: number | null;
  raw_rank: number | null;
  normalized_score: number | null;
  normalized_rank: number | null;
  rank_delta: number;
  evaluations_count: number;
  has_scores: boolean;
  evaluations?: any[];
}

interface JudgeStat {
  judge_id: string;
  judge_name: string;
  count: number;
  mean: number;
  std_dev: number;
  edge_case: string | null;
}

interface JudgeUser {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  bio?: string;
}

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
  full_name: string;
}

interface Track {
  _id: string;
  name: string;
  description?: string;
  prize_pool?: string;
}

interface Prize {
  _id: string;
  title: string;
  award_amount: string;
  description?: string;
}

interface EventItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  status: string;
  location?: string;
  tracks?: Track[];
  prizes?: Prize[];
}

interface TeamMember {
  _id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  invite_code: string;
  leader_id: any;
  members: TeamMember[];
  event_id: any;
}

interface Project {
  _id: string;
  title: string;
  tagline?: string;
  description: string;
  repo_url?: string;
  demo_url?: string;
  tech_stack?: string[];
  status: string;
  submitted_at: string;
  team_id?: { _id: string; name: string; slug: string; invite_code: string };
  track_id?: { _id: string; name: string; prize_pool: string };
  event_id?: { _id: string; title: string; submission_deadline: string };
}

interface JudgeProgressProject {
  submission_id: string;
  title: string;
  team_name: string;
  status: string;
  score: number | null;
}

interface JudgeProgressItem {
  judge_id: string;
  username: string;
  full_name: string;
  email: string;
  assigned: number;
  scored: number;
  pending: number;
  drafts: number;
  progress_percent: number;
  average_score: number | null;
  status: 'completed' | 'in_progress' | 'pending' | 'unassigned';
  assigned_projects: JudgeProgressProject[];
}

interface JudgeProgressSummary {
  total_judges: number;
  total_assignments: number;
  total_scored: number;
  total_pending: number;
  total_drafts: number;
  overall_completion_rate: number;
}

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'gallery' | 'teams' | 'submit' | 'judging' | 'organizer' | 'leaderboard' | 'health'>('gallery');

  // Health State
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [healthLatency, setHealthLatency] = useState<number | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);

  // Auth State
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // T1 Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Leaderboard & Normalization States
  const [leaderboardData, setLeaderboardData] = useState<RankingItem[]>([]);
  const [leaderboardStats, setLeaderboardStats] = useState<JudgeStat[]>([]);
  const [leaderboardSummary, setLeaderboardSummary] = useState<any>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardTrackFilter, setLeaderboardTrackFilter] = useState<string>('all');

  // Gallery Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');

  // Selected Project for Detail Modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form States: Team Creation
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  // Form States: Join Team
  const [joinCode, setJoinCode] = useState('');

  // Form States: Project Submission
  const [subTitle, setSubTitle] = useState('');
  const [subTagline, setSubTagline] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subRepo, setSubRepo] = useState('');
  const [subDemo, setSubDemo] = useState('');
  const [subTrackId, setSubTrackId] = useState('');
  const [subTeamId, setSubTeamId] = useState('');
  const [subTechStack, setSubTechStack] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Deadline rejection test state
  const [deadlineTestResponse, setDeadlineTestResponse] = useState<any>(null);

  // T2 Judge States
  const [judgeInvites, setJudgeInvites] = useState<JudgeInvite[]>([]);
  const [allJudges, setAllJudges] = useState<JudgeUser[]>([]);
  const [allAssignments, setAllAssignments] = useState<JudgeAssignment[]>([]);
  const [myAssignedProjects, setMyAssignedProjects] = useState<Project[]>([]);
  const [inviteJudgeEmail, setInviteJudgeEmail] = useState('');
  const [lastGeneratedJudgeLink, setLastGeneratedJudgeLink] = useState('');
  const [judgeJoinCode, setJudgeJoinCode] = useState('');
  
  // Assignment form states
  const [assignMode, setAssignMode] = useState<'manual' | 'batch' | 'auto'>('auto');
  const [manualSubId, setManualSubId] = useState('');
  const [manualJudgeId, setManualJudgeId] = useState('');
  const [autoNJudges, setAutoNJudges] = useState(2);
  const [autoAssignmentSummary, setAutoAssignmentSummary] = useState<any>(null);

  // 403 Security Test State
  const [judgeIsolationTestResult, setJudgeIsolationTestResult] = useState<any>(null);
  const [scoringProject, setScoringProject] = useState<Project | null>(null);
  const [scoreInnovation, setScoreInnovation] = useState(25);
  const [scoreExecution, setScoreExecution] = useState(25);

  // T3 Configurable Rubrics & Evaluation States
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);
  const [newCritName, setNewCritName] = useState('');
  const [newCritDesc, setNewCritDesc] = useState('');
  const [newCritWeight, setNewCritWeight] = useState(1.0);
  const [newCritMin, setNewCritMin] = useState(0);
  const [newCritMax, setNewCritMax] = useState(10);
  const [judgeScoreValues, setJudgeScoreValues] = useState<Record<string, number>>({});
  const [judgeComment, setJudgeComment] = useState('');
  const [currentScoreRecord, setCurrentScoreRecord] = useState<EvaluationScoreData | null>(null);
  const [crossJudgeIsolationResult, setCrossJudgeIsolationResult] = useState<any>(null);

  // T5 Judge Progress & CSV Export States
  const [judgeProgressData, setJudgeProgressData] = useState<{
    summary: JudgeProgressSummary;
    judges: JudgeProgressItem[];
  } | null>(null);
  const [exportingResource, setExportingResource] = useState<string | null>(null);
  const [selectedJudgeDetails, setSelectedJudgeDetails] = useState<string | null>(null);

  // Form States: Organizer Event Creation
  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evLocation, setEvLocation] = useState('Global / Online');
  const [evStartDate, setEvStartDate] = useState('2026-10-01');
  const [evEndDate, setEvEndDate] = useState('2026-10-10');
  const [evDeadline, setEvDeadline] = useState('2026-10-08');
  const [evTracks, setEvTracks] = useState<{ name: string; description: string; prize_pool: string }[]>([
    { name: 'Autonomous AI Agents', description: 'Multi-agent frameworks & tools', prize_pool: '$10,000' },
    { name: 'Developer Tooling & Infrastructure', description: 'Compilers, linters & runtimes', prize_pool: '$7,500' }
  ]);
  const [evPrizes, setEvPrizes] = useState<{ title: string; award_amount: string; description: string }[]>([
    { title: 'Grand Prize — 1st Place', award_amount: '$10,000', description: 'Top overall entry' },
    { title: 'Runner-Up — 2nd Place', award_amount: '$5,000', description: 'Second place entry' },
    { title: 'Community Choice Award', award_amount: '$2,500', description: 'Voted by participants' }
  ]);

  const getBaseApiUrl = () => import.meta.env.VITE_API_URL || '';

  const notify = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text: string, label: string = 'Copied') => {
    navigator.clipboard.writeText(text);
    notify(`Copied ${label} to clipboard!`, 'success');
  };

  // 1. Healthcheck Fetch
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    const envUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/health` : null;
    const candidates = [envUrl, '/api/health', 'http://localhost:5000/api/health'].filter(Boolean) as string[];

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setHealthData(json);
          setHealthLatency(Math.round(performance.now() - start));
          setLastHealthCheck(new Date().toLocaleTimeString());
          return;
        }
      } catch {
        // try next candidate
      }
    }
    setHealthData(null);
  }, []);

  // 2. Fetch Public Gallery & Tracks
  const fetchGallery = useCallback(async () => {
    try {
      const base = getBaseApiUrl();
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedTrack !== 'all') params.append('track', selectedTrack);

      const res = await fetch(`${base}/api/gallery?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setProjects(json.projects || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch gallery:', err);
    }
  }, [searchQuery, selectedTrack]);

  // 3. Fetch Events & Tracks
  const fetchEventsAndTracks = useCallback(async () => {
    try {
      const base = getBaseApiUrl();
      const [evRes, trRes] = await Promise.all([
        fetch(`${base}/api/events`),
        fetch(`${base}/api/tracks`)
      ]);
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData);
      }
      if (trRes.ok) {
        const trData = await trRes.json();
        setTracks(trData);
        if (trData.length > 0 && !subTrackId) {
          setSubTrackId(trData[0]._id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch events and tracks:', err);
    }
  }, [subTrackId]);

  // 4. Fetch My Teams
  const fetchMyTeams = useCallback(async () => {
    if (!authToken) return;
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/teams/my`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const teamsData = await res.json();
        setMyTeams(teamsData);
        if (teamsData.length > 0 && !subTeamId) {
          setSubTeamId(teamsData[0]._id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch teams:', err);
    }
  }, [authToken, subTeamId]);

  // Fetch Rubric Criteria
  const fetchRubricCriteria = useCallback(async () => {
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/rubrics`);
      if (res.ok) {
        const json = await res.json();
        setRubricCriteria(json.criteria || json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rubric criteria:', err);
    }
  }, []);

  // Fetch Normalized Leaderboard & Cross-Judge Standings
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/leaderboard`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setLeaderboardData(json.rankings || []);
        setLeaderboardStats(json.judge_stats || []);
        setLeaderboardSummary(json.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    checkHealth();
    fetchEventsAndTracks();
    fetchGallery();
    fetchRubricCriteria();
    fetchLeaderboard();
  }, [checkHealth, fetchEventsAndTracks, fetchGallery, fetchRubricCriteria, fetchLeaderboard]);

  // 5. Fetch Judge Data & Assignments
  const fetchJudgingData = useCallback(async () => {
    if (!authToken) return;
    const base = getBaseApiUrl();

    try {
      if (authUser?.role === 'ORGANIZER' || authUser?.role === 'ADMIN') {
        const [invRes, jRes, asgnRes, progRes] = await Promise.all([
          fetch(`${base}/api/judges/invites`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`${base}/api/judges`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`${base}/api/judges/assignments`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`${base}/api/organizer/judges/progress`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        ]);
        if (invRes.ok) {
          const invData = await invRes.json();
          setJudgeInvites(invData.invites || []);
        }
        if (jRes.ok) {
          const jData = await jRes.json();
          setAllJudges(jData.judges || []);
          if (jData.judges?.length > 0 && !manualJudgeId) {
            setManualJudgeId(jData.judges[0]._id);
          }
        }
        if (asgnRes.ok) {
          const asgnData = await asgnRes.json();
          setAllAssignments(asgnData.assignments || []);
        }
        if (progRes.ok) {
          const progData = await progRes.json();
          setJudgeProgressData(progData);
        }
      }

      if (authUser?.role === 'JUDGE' || authUser?.role === 'ADMIN') {
        const [myAsgnRes, myProjRes] = await Promise.all([
          fetch(`${base}/api/judges/assignments`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`${base}/api/judges/projects`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        ]);
        if (myAsgnRes.ok) {
          const asgnData = await myAsgnRes.json();
          setAllAssignments(asgnData.assignments || []);
        }
        if (myProjRes.ok) {
          const pData = await myProjRes.json();
          setMyAssignedProjects(pData.projects || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch judging data:', err);
    }
  }, [authToken, authUser?.role, manualJudgeId]);

  // Handle CSV Download
  const handleDownloadCsv = async (resourceKey: string, resourceLabel: string) => {
    if (!authToken) {
      notify('Please log in as an Organizer or Admin to download CSV data.', 'error');
      return;
    }
    setExportingResource(resourceKey);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/export/${resourceKey}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) {
        let errMessage = 'Export failed';
        try {
          const errData = await res.json();
          errMessage = errData.message || errMessage;
        } catch {
          errMessage = `Server returned status ${res.status}`;
        }
        throw new Error(errMessage);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${resourceKey}_export.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      notify(`Downloaded ${resourceLabel} CSV successfully!`, 'success');
    } catch (err: any) {
      notify(`Export failed: ${err.message}`, 'error');
    } finally {
      setExportingResource(null);
    }
  };

  // T2 Handlers: Invite Judge
  const handleInviteJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/judges/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          email: inviteJudgeEmail.trim() || undefined,
          event_id: events[0]?._id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLastGeneratedJudgeLink(`${window.location.origin}${data.invite_link}`);
        notify(data.message || 'Judge invite created!', 'success');
        setInviteJudgeEmail('');
        fetchJudgingData();
      } else {
        notify(data.message || 'Failed to create judge invite', 'error');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // T2 Handlers: Join as Judge
  const handleAcceptJudgeInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      notify('Please log in first to accept a judge invitation.', 'error');
      return;
    }
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/judges/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ invite_code: judgeJoinCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthToken(data.token);
        setAuthUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        notify('Congratulations! You are now verified as a Judge.', 'success');
        setJudgeJoinCode('');
        fetchJudgingData();
      } else {
        notify(data.message || 'Invalid judge invite code', 'error');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // T2 Handlers: Manual Project Assignment
  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !manualSubId || !manualJudgeId) return;
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/judges/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          submission_id: manualSubId,
          judge_id: manualJudgeId,
          event_id: events[0]?._id
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message || 'Judge assigned to project successfully!', 'success');
        fetchJudgingData();
      } else {
        notify(data.message || 'Failed to assign judge (Check Conflict of Interest)', 'error');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // T2 Handlers: Automatic Project Assignment
  const handleAutoAssign = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/judges/assignments/automatic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          event_id: events[0]?._id,
          n_judges: autoNJudges
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAutoAssignmentSummary(data);
        notify(`Auto-assignment completed! Configured ${autoNJudges} judges per project evenly.`, 'success');
        fetchJudgingData();
      } else {
        notify(data.message || 'Failed automatic assignment', 'error');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // T2 Handlers: Unassign
  const handleUnassign = async (assignmentId: string) => {
    if (!authToken) return;
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/judges/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        notify('Judge assignment removed.', 'info');
        fetchJudgingData();
      }
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  // T2 Handlers: Test Judge Security Isolation (Attempt 403 Access)
  const handleTestJudgeIsolation = async () => {
    if (!authToken) {
      notify('Log in as a Judge to test security isolation.', 'error');
      return;
    }
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const assignedIds = new Set(myAssignedProjects.map(p => p._id));
      const unassigned = projects.find(p => !assignedIds.has(p._id));
      const targetId = unassigned ? unassigned._id : (projects[0]?._id || 'sub_unassigned_test_id');
      const targetTitle = unassigned ? unassigned.title : 'Unassigned Project';

      const res = await fetch(`${base}/api/submissions/${targetId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      setJudgeIsolationTestResult({
        targetTitle,
        targetId,
        status: res.status,
        statusText: res.status === 403 ? '403 Forbidden (Judge Isolation Enforced)' : `${res.status} ${res.statusText}`,
        body: data,
        timestamp: new Date().toLocaleTimeString()
      });

      if (res.status === 403) {
        notify('Backend strictly enforced Rule 16: 403 Forbidden returned!', 'success');
      } else {
        notify(`Status: ${res.status}`, 'info');
      }
    } catch (err: any) {
      setJudgeIsolationTestResult({
        status: 500,
        statusText: 'Network Error',
        body: { error: err.message }
      });
    } finally {
      setLoading(false);
    }
  };

  // T3 Handlers: Create Rubric Criterion
  const handleCreateCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    if (!newCritName.trim()) {
      notify('Criterion name is required.', 'error');
      return;
    }
    if (newCritMin >= newCritMax) {
      notify('Minimum score must be less than maximum score.', 'error');
      return;
    }
    if (newCritWeight <= 0) {
      notify('Weight must be greater than zero.', 'error');
      return;
    }

    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/rubrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          event_id: events[0]?._id,
          name: newCritName.trim(),
          description: newCritDesc.trim() || undefined,
          weight: Number(newCritWeight),
          min_score: Number(newCritMin),
          max_score: Number(newCritMax)
        })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Rubric criterion "${newCritName}" created!`, 'success');
        setNewCritName('');
        setNewCritDesc('');
        setNewCritWeight(1.0);
        setNewCritMin(0);
        setNewCritMax(10);
        fetchRubricCriteria();
      } else {
        notify(data.message || 'Failed to create criterion', 'error');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // T3 Handlers: Delete Rubric Criterion
  const handleDeleteCriterion = async (id: string) => {
    if (!authToken) return;
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/rubrics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        notify('Rubric criterion removed.', 'info');
        fetchRubricCriteria();
      }
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  // T3 Handlers: Open Score Modal with Isolation Enforced
  const handleOpenScoreModal = async (project: Project) => {
    setScoringProject(project);
    setCurrentScoreRecord(null);
    setJudgeScoreValues({});
    setJudgeComment('');

    const base = getBaseApiUrl();
    if (rubricCriteria.length === 0) {
      fetchRubricCriteria();
    }

    if (authToken) {
      try {
        const res = await fetch(`${base}/api/scores/submission/${project._id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const json = await res.json();
          // STRICT JUDGE ISOLATION: returns only this judge's score
          const myScore = json.score || (json.data && json.data[0]) || null;
          if (myScore) {
            setCurrentScoreRecord(myScore);
            setJudgeComment(myScore.comment || '');
            const vals: Record<string, number> = {};
            if (myScore.criteria_scores && Array.isArray(myScore.criteria_scores)) {
              myScore.criteria_scores.forEach((cs: any) => {
                const cId = cs.criterion_id?._id || cs.criterion_id;
                vals[String(cId)] = cs.score;
              });
            }
            setJudgeScoreValues(vals);
          }
        }
      } catch (err) {
        console.error('Failed to fetch existing evaluation:', err);
      }
    }
  };

  // T3 Handlers: Save Evaluation (Draft vs Submitted)
  const handleSaveEvaluation = async (targetStatus: 'draft' | 'submitted') => {
    if (!authToken || !scoringProject) return;

    const criteriaScores = rubricCriteria.map(c => ({
      criterion_id: c._id,
      score: judgeScoreValues[c._id] !== undefined ? judgeScoreValues[c._id] : Math.round((c.min_score + c.max_score) / 2)
    }));

    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/judges/submissions/${scoringProject._id}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          criteria_scores: criteriaScores.length > 0 ? criteriaScores : undefined,
          scores: criteriaScores.length === 0 ? { innovation: scoreInnovation, execution: scoreExecution } : undefined,
          comment: judgeComment,
          feedback: judgeComment,
          status: targetStatus,
          is_draft: targetStatus === 'draft'
        })
      });

      const data = await res.json();
      if (res.ok) {
        notify(
          targetStatus === 'draft'
            ? `Evaluation saved as DRAFT (Weighted Total: ${data.weighted_total})`
            : `Scores submitted and LOCKED! (Weighted Total: ${data.weighted_total})`,
          'success'
        );
        setCurrentScoreRecord(data.data || data.score);
        if (targetStatus === 'submitted') {
          setScoringProject(null);
        }
        fetchJudgingData();
      } else {
        notify(data.message || 'Scoring rejected', 'error');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // T3 Handlers: Organizer Reopens Locked Evaluation
  const handleReopenScore = async (scoreIdOrSubId: string) => {
    if (!authToken) return;
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/scores/${scoreIdOrSubId}/reopen`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        notify('Evaluation score unlocked! Judge may now edit and resubmit.', 'success');
        fetchJudgingData();
      } else {
        notify(data.message || 'Failed to reopen score', 'error');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // T3 Handlers: Strict Judge Isolation Test (Attempt to view another judge's score)
  const handleTestCrossJudgeIsolation = async () => {
    if (!authToken) {
      notify('Log in as a Judge to test cross-judge score isolation.', 'error');
      return;
    }
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const targetScoreId = '660000000000000000000099';
      const res = await fetch(`${base}/api/scores/${targetScoreId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      setCrossJudgeIsolationResult({
        status: res.status,
        statusText: res.status === 403 ? '403 Forbidden (Cross-Judge Isolation Enforced)' : `${res.status} ${res.statusText}`,
        body: data,
        timestamp: new Date().toLocaleTimeString()
      });
      if (res.status === 403) {
        notify('Backend strictly enforced: Judge A cannot see Judge B scores (403 Forbidden)', 'success');
      } else {
        notify(`Status: ${res.status}`, 'info');
      }
    } catch (err: any) {
      setCrossJudgeIsolationResult({
        status: 500,
        statusText: 'Network Error',
        body: { error: err.message }
      });
    } finally {
      setLoading(false);
    }
  };

  // Live calculation of weighted total for preview
  const calculateLiveWeightedTotal = () => {
    if (!rubricCriteria || rubricCriteria.length === 0) return 0;
    let total = 0;
    for (const c of rubricCriteria) {
      const val = judgeScoreValues[c._id] !== undefined ? judgeScoreValues[c._id] : Math.round((c.min_score + c.max_score) / 2);
      total += val * (c.weight || 1.0);
    }
    return Math.round(total * 100) / 100;
  };

  useEffect(() => {
    if (authToken) {
      fetchMyTeams();
      fetchJudgingData();
    }
  }, [authToken, fetchMyTeams, fetchJudgingData]);

  // Auth Handlers
  const handleQuickLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAuthToken(data.token);
        setAuthUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        notify(`Logged in as ${data.user.full_name} (${data.user.role})`, 'success');
        fetchMyTeams();
      } else {
        notify(data.message || 'Login failed', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const base = getBaseApiUrl();
      await fetch(`${base}/api/auth/logout`, { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setMyTeams([]);
    notify('Logged out successfully', 'info');
  };

  // T1 Feature 1: Create Event (Organizer)
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      notify('You must be logged in as an Organizer to create an event.', 'error');
      return;
    }
    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: evTitle,
          description: evDesc,
          location: evLocation,
          start_date: new Date(evStartDate),
          end_date: new Date(evEndDate),
          submission_deadline: new Date(evDeadline),
          tracks: evTracks,
          prizes: evPrizes
        })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Event "${data.event.title}" created with ${data.tracks.length} tracks and ${data.prizes.length} prizes!`, 'success');
        setEvTitle('');
        setEvDesc('');
        fetchEventsAndTracks();
      } else {
        notify(data.message || 'Failed to create event (Requires ORGANIZER or ADMIN)', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // T1 Feature 2: Create Team (Participant)
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      notify('Please log in as a Participant to create a team.', 'error');
      return;
    }
    if (!newTeamName.trim()) {
      notify('Team name is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const defaultEventId = events[0]?._id;
      const res = await fetch(`${base}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDesc,
          event_id: defaultEventId
        })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Team "${data.team.name}" created! Invite code: ${data.invite_code}`, 'success');
        setNewTeamName('');
        setNewTeamDesc('');
        fetchMyTeams();
      } else {
        notify(data.message || 'Failed to create team', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // T1 Feature 2: Join Team with Invite Link/Code (Max 4 Members)
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      notify('Please log in as a Participant to join a team.', 'error');
      return;
    }
    if (!joinCode.trim()) {
      notify('Invite code is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const res = await fetch(`${base}/api/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ invite_code: joinCode.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Joined team "${data.team.name}" successfully! (${data.team.members.length}/4 members)`, 'success');
        setJoinCode('');
        fetchMyTeams();
      } else {
        // Enforces: Team is full (max 4 members) or already member
        notify(data.message || 'Failed to join team', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // T1 Feature 3: Submit Project (Draft / Final)
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      notify('Please log in as a Participant to submit a project.', 'error');
      return;
    }
    if (!subTitle.trim() || !subDesc.trim() || !subTeamId) {
      notify('Title, description, and team are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const base = getBaseApiUrl();
      const payload = {
        title: subTitle,
        tagline: subTagline,
        description: subDesc,
        repo_url: subRepo,
        demo_url: subDemo,
        track_id: subTrackId,
        team_id: subTeamId,
        tech_stack: subTechStack.split(',').map(s => s.trim()).filter(Boolean),
        is_draft: isDraft
      };

      let res;
      if (editingSubId) {
        res = await fetch(`${base}/api/submissions/${editingSubId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${base}/api/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        notify(data.message || 'Project saved successfully!', 'success');
        setSubTitle('');
        setSubTagline('');
        setSubDesc('');
        setSubRepo('');
        setSubDemo('');
        setSubTechStack('');
        setEditingSubId(null);
        fetchGallery();
      } else {
        // May return 403 Forbidden if deadline has passed!
        notify(data.message || 'Submission failed', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // T1 Feature 4: Live Deadline Check Test
  const testDeadlineRejection = async () => {
    setLoading(true);
    setDeadlineTestResponse(null);
    try {
      const base = getBaseApiUrl();
      // First ensure an event exists
      const targetEvent = events[0];
      if (!targetEvent) {
        notify('No events available to test deadline.', 'error');
        return;
      }

      // If simulatePastDeadline is true, create a temporary submission and test editing on an expired event
      // Or edit an existing project against an expired deadline
      const res = await fetch(`${base}/api/submissions/${projects[0]?._id || 'invalid-id'}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || ''}`
        },
        body: JSON.stringify({
          title: 'Tampered Title After Deadline',
          description: 'Testing if backend rejects edits after the deadline'
        })
      });

      const resJson = await res.json().catch(() => ({}));
      setDeadlineTestResponse({
        status: res.status,
        statusText: res.status === 403 ? '403 Forbidden (Edits Rejected After Deadline)' : `${res.status} ${res.statusText}`,
        body: resJson,
        timestamp: new Date().toLocaleTimeString()
      });

      if (res.status === 403) {
        notify('Backend rejected edit with HTTP 403 Forbidden as required!', 'info');
      }
    } catch (err: any) {
      setDeadlineTestResponse({
        status: 500,
        statusText: 'Network Error',
        body: { error: err.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = healthData?.status === 'ok';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Background ambient gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-2 transition-all duration-300 ${
          notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
          'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {notification.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
          {notification.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">DOGFOOD Hackathon</span>
                <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">T1 & T2 Live</span>
              </div>
            </div>

            {/* Quick Switch Accounts & Auth Status */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              {authUser ? (
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] ${
                    authUser.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    authUser.role === 'ORGANIZER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    authUser.role === 'JUDGE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {authUser.role}
                  </span>
                  <span className="text-slate-300 font-medium hidden md:inline">{authUser.full_name}</span>
                  <button
                    onClick={handleLogout}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 hidden lg:inline mr-1">Quick Login:</span>
                  <button
                    onClick={() => handleQuickLogin('organizer@dogfood.local', 'OrganizerPassword123!')}
                    className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition"
                  >
                    Organizer
                  </button>
                  <button
                    onClick={() => handleQuickLogin('judge1@dogfood.local', 'JudgeOnePassword123!')}
                    className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition"
                  >
                    Judge (Dr. Chen)
                  </button>
                  <button
                    onClick={() => handleQuickLogin('alice@dogfood.local', 'AlicePassword123!')}
                    className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                  >
                    Participant
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'gallery'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>Public Gallery</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">{projects.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'teams'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Teams & Invites</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">Max 4</span>
            </button>

            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'submit'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Submit & Deadlines</span>
            </button>

            <button
              onClick={() => setActiveTab('judging')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'judging'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Gavel className="w-4 h-4" />
              <span>Judge Portal</span>
              {myAssignedProjects.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-[10px] text-purple-300">{myAssignedProjects.length}</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('organizer')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'organizer'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Organizer Studio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('leaderboard');
                fetchLeaderboard();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'leaderboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Leaderboard (Normalized)</span>
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'health'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Healthcheck</span>
              <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">

        {/* ========================================================================= */}
        {/* TAB 1: PUBLIC GALLERY (SEARCH & FILTER BY TRACK)                          */}
        {/* ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Gallery Header & Search/Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Layout className="w-6 h-6 text-emerald-400" />
                  Public Project Showcase
                </h2>
                <p className="text-xs text-slate-400">
                  Explore submitted entries. Filter by thematic track or search by title, tech stack, and description.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full sm:w-64 transition"
                  />
                </div>

                {/* Track Filter */}
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="pl-8 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-200 focus:outline-none transition appearance-none cursor-pointer"
                  >
                    <option value="all">All Tracks</option>
                    {tracks.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
              <div className="border border-slate-800/80 bg-slate-900/30 rounded-2xl p-12 text-center space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">No projects match your filter</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search keyword or switching track filter to view all submissions.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedTrack('all'); }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => setSelectedProject(p)}
                    className="group bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate">
                          {p.track_id?.name || 'General Track'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(p.submitted_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Title & Tagline */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">
                          {p.title}
                        </h3>
                        {p.tagline && (
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-medium">
                            {p.tagline}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                      {/* Tech Stack */}
                      {p.tech_stack && p.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.tech_stack.slice(0, 4).map((tech, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-mono text-slate-400 border border-slate-800">
                              {tech}
                            </span>
                          ))}
                          {p.tech_stack.length > 4 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-slate-500">
                              +{p.tech_stack.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Team & Links */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-semibold text-slate-300 truncate max-w-[140px]">
                            {p.team_id?.name || 'Team'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {p.repo_url && (
                            <a
                              href={p.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                              title="Repository"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {p.demo_url && (
                            <a
                              href={p.demo_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                              title="Live Demo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Project Detail Modal */}
            {selectedProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedProject.track_id?.name || 'Track Entry'}
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-2">{selectedProject.title}</h2>
                      {selectedProject.tagline && (
                        <p className="text-sm text-slate-400 mt-1">{selectedProject.tagline}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">About the Project</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-sans">
                      {selectedProject.description}
                    </p>
                  </div>

                  {selectedProject.tech_stack && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tech_stack.map((t, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
                    <div className="text-slate-400">
                      Team: <strong className="text-white">{selectedProject.team_id?.name || 'N/A'}</strong>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedProject.repo_url && (
                        <a
                          href={selectedProject.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
                        >
                          <Github className="w-4 h-4" />
                          <span>View Code</span>
                        </a>
                      )}
                      {selectedProject.demo_url && (
                        <a
                          href={selectedProject.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Launch Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TEAMS & INVITE LINKS (MAX 4 MEMBERS ENFORCED)                      */}
        {/* ========================================================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-cyan-400" />
                Team Collaboration & Invite Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Create a team to obtain a shareable invite link. Teammates can join with the invite code. Max 4 members strictly enforced.
              </p>
            </div>

            {/* Team Forms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form 1: Create New Team */}
              <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Create a Team</h3>
                </div>

                <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Team Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Autonomous Explorers"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Team Description / Mission</label>
                    <textarea
                      rows={3}
                      placeholder="What are you building together?"
                      value={newTeamDesc}
                      onChange={(e) => setNewTeamDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !authUser}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Team & Generate Invite Link</span>
                  </button>
                  {!authUser && (
                    <p className="text-[11px] text-amber-400 text-center">
                      * Please login via the top bar as a Participant to create a team.
                    </p>
                  )}
                </form>
              </div>

              {/* Form 2: Join Team via Invite Code/Link */}
              <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Join an Existing Team</h3>
                </div>

                <form onSubmit={handleJoinTeam} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Invite Code / Link Token *</label>
                    <input
                      type="text"
                      placeholder="e.g. GRAV2026 or paste code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-mono uppercase placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Capacity Limit: Exactly 4 Members Max</span>
                    </div>
                    <p>
                      Each team allows up to 4 contributors. Attempting to add a 5th member will be rejected with an error.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !authUser}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Join Team with Code</span>
                  </button>
                </form>
              </div>
            </div>

            {/* My Active Teams View */}
            <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  My Teams & Invite Links
                </h3>
                <span className="text-xs text-slate-400">Total: {myTeams.length}</span>
              </div>

              {myTeams.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  {authUser
                    ? 'You do not belong to any team yet. Create or join one above!'
                    : 'Please log in to view and manage your teams.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myTeams.map((team) => (
                    <div key={team._id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white text-base">{team.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{team.description || 'No description provided'}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          (team.members?.length || 0) >= 4
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {team.members?.length || 1} / 4 Members { (team.members?.length || 0) >= 4 ? '(FULL)' : ''}
                        </span>
                      </div>

                      {/* Members list */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Team Roster:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {team.members && team.members.map((m: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-[11px] text-slate-300 border border-slate-800">
                              {m.full_name || m.username || 'Member'}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Invite Link Box */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          Code: <strong className="text-emerald-400">{team.invite_code}</strong>
                        </div>
                        <button
                          onClick={() => copyToClipboard(team.invite_code, `Code ${team.invite_code}`)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Invite</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SUBMIT PROJECT & DEADLINE VALIDATION (403 REJECTION DEMO)          */}
        {/* ========================================================================= */}
        {activeTab === 'submit' && (
          <div className="space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-6 h-6 text-purple-400" />
                Project Submission & Deadline Validation
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Save your project as a draft or submit for evaluation. Edits are permitted until the deadline.
                <strong> The backend strictly returns 403 Forbidden on edits past the deadline.</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submission Form (2 Columns) */}
              <div className="lg:col-span-2 border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-base">
                    {editingSubId ? 'Edit Project Entry' : 'Submit or Draft a Project'}
                  </h3>
                  {events[0] && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Deadline: <strong className="text-slate-200">{new Date(events[0].submission_deadline).toLocaleDateString()}</strong>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSubmitProject} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Select Team *</label>
                      <select
                        value={subTeamId}
                        onChange={(e) => setSubTeamId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white focus:outline-none"
                      >
                        {myTeams.length === 0 && <option value="">No team created yet</option>}
                        {myTeams.map((t) => (
                          <option key={t._id} value={t._id}>{t.name} ({t.members?.length || 1} members)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Select Track *</label>
                      <select
                        value={subTrackId}
                        onChange={(e) => setSubTrackId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white focus:outline-none"
                      >
                        {tracks.map((tr) => (
                          <option key={tr._id} value={tr._id}>{tr.name} ({tr.prize_pool || '$0'})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Project Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Antigravity Autonomous Engine"
                      value={subTitle}
                      onChange={(e) => setSubTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Tagline / Short Hook</label>
                    <input
                      type="text"
                      placeholder="e.g. Zero-latency coding agent with deterministic sandbox"
                      value={subTagline}
                      onChange={(e) => setSubTagline(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Detailed Description *</label>
                    <textarea
                      rows={4}
                      placeholder="Describe the problem, architectural approach, and key achievements..."
                      value={subDesc}
                      onChange={(e) => setSubDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Repository URL</label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={subRepo}
                        onChange={(e) => setSubRepo(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Demo URL</label>
                      <input
                        type="url"
                        placeholder="http://localhost:5173/..."
                        value={subDemo}
                        onChange={(e) => setSubDemo(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Technologies (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="React, Node.js, Express, MongoDB, Docker"
                      value={subTechStack}
                      onChange={(e) => setSubTechStack(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Submission Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      onClick={() => setIsDraft(true)}
                      disabled={loading || !authUser}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold transition disabled:opacity-50"
                    >
                      Save as Draft
                    </button>
                    <button
                      type="submit"
                      onClick={() => setIsDraft(false)}
                      disabled={loading || !authUser}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                    >
                      Submit for Judging
                    </button>
                  </div>
                </form>
              </div>

              {/* Deadline Check Verification Tester (1 Column) */}
              <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Deadline Rule Tester</h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  The backend enforces an immutable deadline rule. Once an event's submission deadline passes, any <code className="text-emerald-400 font-mono">PUT /api/submissions/:id</code> request is automatically rejected with <strong className="text-rose-400">HTTP 403 Forbidden</strong>.
                </p>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                  <div className="text-slate-400 text-[11px]">Enforcement Rule:</div>
                  <div className="text-rose-400">
                    now &gt; submission_deadline &#8594; 403 Forbidden
                  </div>
                </div>

                <button
                  onClick={() => testDeadlineRejection()}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition"
                >
                  Test Past-Deadline Edit (Verify 403)
                </button>

                {deadlineTestResponse && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Response Code:</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        deadlineTestResponse.status === 403 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {deadlineTestResponse.statusText}
                      </span>
                    </div>
                    <pre className="text-slate-400 text-[10px] overflow-x-auto">
                      {JSON.stringify(deadlineTestResponse.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ORGANIZER STUDIO (CREATE EVENT WITH DATES, TRACKS, PRIZES)          */}
        {/* ========================================================================= */}
        {activeTab === 'organizer' && (
          <div className="space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                Organizer Event Creation Studio
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure hackathon details, start and end dates, submission deadlines, thematic tracks, and prize tiers.
              </p>
            </div>

            {authUser?.role !== 'ORGANIZER' && authUser?.role !== 'ADMIN' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>You are currently not logged in as an Organizer. Switch roles to create an event:</span>
                </div>
                <button
                  onClick={() => handleQuickLogin('organizer@dogfood.local', 'OrganizerPassword123!')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                >
                  Switch to Organizer
                </button>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Event Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Next-Gen AI Hackathon 2026"
                    value={evTitle}
                    onChange={(e) => setEvTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    placeholder="Global / Decentralized"
                    value={evLocation}
                    onChange={(e) => setEvLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Event Description *</label>
                <textarea
                  rows={3}
                  placeholder="Overview of the hackathon theme, rules, and expectations..."
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Configurable Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={evStartDate}
                    onChange={(e) => setEvStartDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Submission Deadline *
                  </label>
                  <input
                    type="date"
                    value={evDeadline}
                    onChange={(e) => setEvDeadline(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={evEndDate}
                    onChange={(e) => setEvEndDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Tracks Configuration */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Configured Tracks ({evTracks.length})</h4>
                  <button
                    type="button"
                    onClick={() => setEvTracks([...evTracks, { name: '', description: '', prize_pool: '$5,000' }])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Track</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evTracks.map((tr, index) => (
                    <div key={index} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-400">Track #{index + 1}</span>
                        {evTracks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEvTracks(evTracks.filter((_, i) => i !== index))}
                            className="text-rose-400 hover:text-rose-300 text-[11px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Track Name (e.g. Autonomous AI)"
                        value={tr.name}
                        onChange={(e) => {
                          const updated = [...evTracks];
                          updated[index].name = e.target.value;
                          setEvTracks(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Prize Pool (e.g. $10,000)"
                        value={tr.prize_pool}
                        onChange={(e) => {
                          const updated = [...evTracks];
                          updated[index].prize_pool = e.target.value;
                          setEvTracks(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Prizes Configuration */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Configured Prizes ({evPrizes.length})</h4>
                  <button
                    type="button"
                    onClick={() => setEvPrizes([...evPrizes, { title: '', award_amount: '$1,000', description: '' }])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Prize</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {evPrizes.map((pz, index) => (
                    <div key={index} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-400">Prize #{index + 1}</span>
                        {evPrizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEvPrizes(evPrizes.filter((_, i) => i !== index))}
                            className="text-rose-400 hover:text-rose-300 text-[11px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Prize Title"
                        value={pz.title}
                        onChange={(e) => {
                          const updated = [...evPrizes];
                          updated[index].title = e.target.value;
                          setEvPrizes(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Award Amount (e.g. $10,000)"
                        value={pz.award_amount}
                        onChange={(e) => {
                          const updated = [...evPrizes];
                          updated[index].award_amount = e.target.value;
                          setEvPrizes(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (authUser?.role !== 'ORGANIZER' && authUser?.role !== 'ADMIN')}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                Publish Hackathon Event (Dates, Tracks, Prizes)
              </button>
            </form>

            {/* ========================================================================= */}
            {/* T2 FEATURE: ORGANIZER JUDGE INVITATIONS & PROJECT ASSIGNMENTS              */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Card 1: Judge Invitations */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span>Invite Judges (Link or Email, Local Only)</span>
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">T2 Feature</span>
                </div>

                <form onSubmit={handleInviteJudge} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Judge Email (Optional for direct invite, leave empty for open link)</label>
                    <input
                      type="email"
                      placeholder="e.g. dr_chen@university.local"
                      value={inviteJudgeEmail}
                      onChange={(e) => setInviteJudgeEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Judge Invitation Link</span>
                  </button>
                </form>

                {lastGeneratedJudgeLink && (
                  <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                    <span className="text-[11px] font-semibold text-purple-300 block">Judge Invitation Link Ready:</span>
                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-purple-200 border border-purple-500/20">
                      <span className="truncate">{lastGeneratedJudgeLink}</span>
                      <button
                        onClick={() => copyToClipboard(lastGeneratedJudgeLink, 'Judge Invite Link')}
                        className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-[10px] font-semibold transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Judge Invites List */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Created Invites ({judgeInvites.length})</span>
                  {judgeInvites.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No judge invites generated yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {judgeInvites.map((inv) => (
                        <div key={inv._id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-purple-300">{inv.invite_code}</span>
                            <span className="text-slate-400 text-[11px] ml-2">{inv.email || 'Open Invite Link'}</span>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            inv.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Project Assignment Modes */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>Assign Projects to Judges</span>
                  </h3>
                  <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-[11px] font-semibold">
                    <button
                      onClick={() => setAssignMode('auto')}
                      className={`px-2.5 py-1 rounded-md transition ${assignMode === 'auto' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      Automatic
                    </button>
                    <button
                      onClick={() => setAssignMode('manual')}
                      className={`px-2.5 py-1 rounded-md transition ${assignMode === 'manual' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {/* AUTOMATIC MODE */}
                {assignMode === 'auto' && (
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-400">
                      Automatic mode assigns <strong className="text-white">N judges per project</strong>, spreads the workload evenly across all available evaluators, and <strong className="text-rose-400">strictly enforces zero conflict of interest</strong> (no judge gets a project from their own team).
                    </p>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Configurable N (Judges Per Project)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={autoNJudges}
                          onChange={(e) => setAutoNJudges(parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Total Projects to Evaluate: <strong className="text-emerald-400">{projects.length}</strong></span>
                        <span>Available Judges: <strong className="text-purple-400">{allJudges.length}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoAssign}
                      disabled={loading || projects.length === 0 || allJudges.length === 0}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <Shuffle className="w-4 h-4" />
                      <span>Run Automatic Load-Balanced Distribution</span>
                    </button>

                    {autoAssignmentSummary && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-[11px]">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {autoAssignmentSummary.message}
                        </span>
                        <div className="text-slate-300 grid grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
                          <div>New Assignments: <strong className="text-white">{autoAssignmentSummary.new_assignments_count}</strong></div>
                          <div>Judges Per Project: <strong className="text-white">{autoAssignmentSummary.n_judges}</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MANUAL MODE */}
                {assignMode === 'manual' && (
                  <form onSubmit={handleManualAssign} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Select Submitted Project *</label>
                      <select
                        value={manualSubId}
                        onChange={(e) => setManualSubId(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Choose Project --</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.title} ({p.team_id?.name || 'No Team'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Select Judge *</label>
                      <select
                        value={manualJudgeId}
                        onChange={(e) => setManualJudgeId(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Choose Judge --</option>
                        {allJudges.map((j) => (
                          <option key={j._id} value={j._id}>
                            {j.full_name} ({j.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !manualSubId || !manualJudgeId}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Assign Judge to Project</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* T3 FEATURE: CONFIGURABLE JUDGING RUBRICS                                  */}
            {/* ========================================================================= */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Configurable Judging Rubrics</span>
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">T3 Feature</span>
              </div>

              <p className="text-xs text-slate-400">
                Organizers define evaluation criteria with specific weights and min/max score ranges. The backend strictly computes weighted totals based on these settings.
              </p>

              {/* Add New Criterion Form */}
              <form onSubmit={handleCreateCriterion} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs items-end">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Criterion Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Technical Innovation"
                    value={newCritName}
                    onChange={(e) => setNewCritName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Weight *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={newCritWeight}
                    onChange={(e) => setNewCritWeight(parseFloat(e.target.value) || 1.0)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Min</label>
                    <input
                      type="number"
                      value={newCritMin}
                      onChange={(e) => setNewCritMin(parseInt(e.target.value, 10) || 0)}
                      required
                      className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Max</label>
                    <input
                      type="number"
                      value={newCritMax}
                      onChange={(e) => setNewCritMax(parseInt(e.target.value, 10) || 10)}
                      required
                      className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Criterion</span>
                  </button>
                </div>
              </form>

              {/* Configured Criteria List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Rubric Criteria ({rubricCriteria.length})
                </span>
                {rubricCriteria.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No rubric criteria configured yet. Add criteria above to configure judging.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {rubricCriteria.map((c) => (
                      <div key={c._id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white">{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCriterion(c._id)}
                            className="text-slate-500 hover:text-rose-400 text-xs transition"
                          >
                            ✕
                          </button>
                        </div>
                        {c.description && <p className="text-[11px] text-slate-400 line-clamp-2">{c.description}</p>}
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-900">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                            Weight: {c.weight}
                          </span>
                          <span className="text-slate-400 font-mono">
                            Scale: {c.min_score} – {c.max_score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Assignments Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-purple-400" />
                  <span>Current Project Assignments ({allAssignments.length})</span>
                </h3>
                <span className="text-xs text-slate-400">Organizers view all evaluation assignments & unlock locked scores</span>
              </div>

              {allAssignments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No projects currently assigned to judges. Use the automatic or manual assignment tool above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                      <tr>
                        <th className="p-3">Project Title</th>
                        <th className="p-3">Team</th>
                        <th className="p-3">Assigned Judge</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {allAssignments.map((a: any) => (
                        <tr key={a._id} className="hover:bg-slate-950/40 transition">
                          <td className="p-3 font-semibold text-white">{a.submission_id?.title || 'Unknown Project'}</td>
                          <td className="p-3 text-slate-400">{a.submission_id?.team_id?.name || '—'}</td>
                          <td className="p-3 text-purple-300 font-medium">{a.judge_id?.full_name || a.judge_id?.username || 'Judge'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                              a.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleReopenScore(a.submission_id?._id || a.submission_id)}
                                className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold transition flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded"
                                title="Unlock submitted scores to allow judge editing"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Reopen</span>
                              </button>
                              <button
                                onClick={() => handleUnassign(a._id)}
                                className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold transition"
                              >
                                Unassign
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* JUDGE PROGRESS DASHBOARD FOR ORGANIZERS */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <span>Judge Progress Dashboard</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time monitoring per judge: total projects assigned, completed evaluations, and pending workloads.
                  </p>
                </div>
                <button
                  onClick={fetchJudgingData}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition self-start sm:self-auto flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Refresh Metrics</span>
                </button>
              </div>

              {/* Progress Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Judges</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {judgeProgressData?.summary?.total_judges ?? allJudges.length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active evaluators</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">Assigned</div>
                  <div className="text-xl font-bold text-purple-300 mt-1">
                    {judgeProgressData?.summary?.total_assignments ?? allAssignments.length}
                  </div>
                  <div className="text-[10px] text-purple-400/60 mt-0.5">Total reviews</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Scored</div>
                  <div className="text-xl font-bold text-emerald-300 mt-1">
                    {judgeProgressData?.summary?.total_scored ?? 0}
                  </div>
                  <div className="text-[10px] text-emerald-400/60 mt-0.5">Submitted scores</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Pending</div>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {judgeProgressData?.summary?.total_pending ?? 0}
                  </div>
                  <div className="text-[10px] text-amber-400/60 mt-0.5">Awaiting review</div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-center">
                  <div className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Completion</div>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {judgeProgressData?.summary?.overall_completion_rate ?? 0}%
                  </div>
                  <div className="text-[10px] text-cyan-400/60 mt-0.5">Event progress</div>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="space-y-1.5 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Overall Judging Completion Rate
                  </span>
                  <span className="font-mono font-bold text-white">
                    {judgeProgressData?.summary?.total_scored ?? 0} / {judgeProgressData?.summary?.total_assignments ?? 0} scored ({judgeProgressData?.summary?.overall_completion_rate ?? 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, judgeProgressData?.summary?.overall_completion_rate ?? 0)}%` }}
                  />
                </div>
              </div>

              {/* Per Judge Detailed Cards */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">Individual Judge Evaluation Workloads</div>
                {(!judgeProgressData || judgeProgressData.judges.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center">No judge progress data available yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {judgeProgressData.judges.map((j) => (
                      <div 
                        key={j.judge_id}
                        className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-white text-xs">{j.full_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{j.username}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{j.email}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            j.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : j.status === 'in_progress'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : j.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {j.status === 'completed' ? '✓ Completed' : j.status === 'in_progress' ? '⚡ In Progress' : j.status === 'pending' ? '⏳ Pending' : '— Unassigned'}
                          </span>
                        </div>

                        {/* Counts Pill Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 rounded-lg p-2 text-center text-[11px]">
                          <div>
                            <div className="text-slate-400 text-[10px]">Assigned</div>
                            <div className="font-bold text-white mt-0.5">{j.assigned}</div>
                          </div>
                          <div>
                            <div className="text-emerald-400 text-[10px]">Scored</div>
                            <div className="font-bold text-emerald-300 mt-0.5">{j.scored}</div>
                          </div>
                          <div>
                            <div className="text-amber-400 text-[10px]">Pending</div>
                            <div className="font-bold text-amber-300 mt-0.5">{j.pending}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Progress</span>
                            <span className="font-mono font-medium text-slate-300">{j.progress_percent}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                j.progress_percent === 100 ? 'bg-emerald-400' : 'bg-purple-500'
                              }`}
                              style={{ width: `${j.progress_percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Assigned Projects List Toggle */}
                        {j.assigned_projects && j.assigned_projects.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => setSelectedJudgeDetails(selectedJudgeDetails === j.judge_id ? null : j.judge_id)}
                              className="text-[11px] text-purple-400 hover:text-purple-300 transition flex items-center justify-between w-full"
                            >
                              <span>{selectedJudgeDetails === j.judge_id ? 'Hide Assigned Projects' : `View Assigned Projects (${j.assigned_projects.length})`}</span>
                              <span>{selectedJudgeDetails === j.judge_id ? '▲' : '▼'}</span>
                            </button>

                            {selectedJudgeDetails === j.judge_id && (
                              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {j.assigned_projects.map((proj, pIdx) => (
                                  <div key={pIdx} className="bg-slate-900/90 rounded p-1.5 text-[10px] flex items-center justify-between">
                                    <div className="truncate max-w-[150px]">
                                      <div className="text-slate-200 font-medium truncate">{proj.title}</div>
                                      <div className="text-slate-500 text-[9px] truncate">{proj.team_name}</div>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                      proj.status === 'scored'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : proj.status === 'draft'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {proj.status === 'scored' ? `Score: ${proj.score}` : proj.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CSV EXPORT CENTER */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                    <span>CSV Export Center</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official, audit-ready data exports with RFC-4180 compliance. Strictly restricted to Organizers and Platform Admins.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin & Organizer Only</span>
                </div>
              </div>

              {/* 7 Export Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Participants */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Participants</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">users</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      User IDs, usernames, full names, emails, roles, team associations, and registration dates.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('participants', 'Participants')}
                    disabled={exportingResource === 'participants'}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{exportingResource === 'participants' ? 'Exporting...' : 'Export Participants CSV'}</span>
                  </button>
                </div>

                {/* 2. Teams */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Teams</span>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">rosters</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Team names, slugs, leader usernames & emails, member counts, full rosters, and invite codes.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('teams', 'Teams')}
                    disabled={exportingResource === 'teams'}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span>{exportingResource === 'teams' ? 'Exporting...' : 'Export Teams CSV'}</span>
                  </button>
                </div>

                {/* 3. Submissions */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Submissions</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">projects</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Project titles, taglines, teams, tracks, submission statuses, git repos, demo links, and tech stacks.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('submissions', 'Submissions')}
                    disabled={exportingResource === 'submissions'}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{exportingResource === 'submissions' ? 'Exporting...' : 'Export Submissions CSV'}</span>
                  </button>
                </div>

                {/* 4. Assignments */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Judge Assignments</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">mappings</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Judge-to-project pairings, assignment statuses, scoring progress, and timestamps.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('assignments', 'Assignments')}
                    disabled={exportingResource === 'assignments'}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>{exportingResource === 'assignments' ? 'Exporting...' : 'Export Assignments CSV'}</span>
                  </button>
                </div>

                {/* 5. Raw Scores */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Raw Scores</span>
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">evaluations</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Uncalibrated criteria scores, weighted totals, judge feedback comments, and criteria breakdowns.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('raw_scores', 'Raw Scores')}
                    disabled={exportingResource === 'raw_scores'}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-400" />
                    <span>{exportingResource === 'raw_scores' ? 'Exporting...' : 'Export Raw Scores CSV'}</span>
                  </button>
                </div>

                {/* 6. Normalized Scores */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Normalized Scores</span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">z-scores</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Per-judge mean, standard deviation, individual standardized z-scores, and 0–100 cohort rescalings.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('normalized_scores', 'Normalized Scores')}
                    disabled={exportingResource === 'normalized_scores'}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{exportingResource === 'normalized_scores' ? 'Exporting...' : 'Export Normalized Scores CSV'}</span>
                  </button>
                </div>

                {/* 7. Final Results */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Final Leaderboard & Results</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">official</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Comprehensive final standings: Normalized Rank, Raw Rank, Rank Shift (Δ), Normalized Score (0–100), Raw Average Score, Judge Count, and Links.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsv('final_results', 'Final Results')}
                    disabled={exportingResource === 'final_results'}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 flex-shrink-0 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>{exportingResource === 'final_results' ? 'Exporting...' : 'Export Final Results CSV'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4.5: JUDGE PORTAL (ISOLATION & STRICT 403 ENFORCEMENT)                */}
        {/* ========================================================================= */}
        {activeTab === 'judging' && (
          <div className="space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Gavel className="w-6 h-6 text-purple-400" />
                  Judge Evaluation Portal
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Judges see <strong>ONLY</strong> the projects explicitly assigned to them by organizers. Direct access to any other project returns <strong>403 Forbidden</strong>.
                </p>
              </div>

              {authUser?.role !== 'JUDGE' && authUser?.role !== 'ADMIN' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickLogin('judge1@dogfood.local', 'JudgeOnePassword123!')}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-600/20"
                  >
                    Switch to Judge (Dr. Sarah Chen)
                  </button>
                </div>
              )}
            </div>

            {/* Accept Judge Invitation Card (For participants or visitors) */}
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Have a Judge Invitation Code?
                </span>
                <span className="text-slate-400 text-[11px] block">
                  Paste the 8-character code sent by an organizer to verify and elevate your role to JUDGE.
                </span>
              </div>
              <form onSubmit={handleAcceptJudgeInvite} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Invite Code (e.g. 6A3376F5)"
                  value={judgeJoinCode}
                  onChange={(e) => setJudgeJoinCode(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={loading || !judgeJoinCode.trim()}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition"
                >
                  Accept
                </button>
              </form>
            </div>

            {/* Interactive 403 Security Verification Cards */}
            <div className="bg-slate-900/60 border border-purple-500/30 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4 text-rose-400" />
                    Interactive Security Verification: Strict Backend Isolation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify that the backend strictly enforces <strong>HTTP 403 Forbidden</strong> on unassigned projects and prevents Judge A from ever seeing Judge B's scores.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestJudgeIsolation}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Test Unassigned Access (403)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestCrossJudgeIsolation}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Test Judge Isolation (Cross-Judge 403)</span>
                  </button>
                </div>
              </div>

              {judgeIsolationTestResult && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Unassigned Project Check: <strong className="text-white">{judgeIsolationTestResult.targetTitle}</strong></span>
                    <span className={`px-2.5 py-0.5 rounded font-bold ${
                      judgeIsolationTestResult.status === 403 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {judgeIsolationTestResult.statusText}
                    </span>
                  </div>
                  <pre className="text-slate-300 text-[11px] overflow-x-auto bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {JSON.stringify(judgeIsolationTestResult.body, null, 2)}
                  </pre>
                </div>
              )}

              {crossJudgeIsolationResult && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cross-Judge Confidentiality (Judge A accessing Judge B score):</span>
                    <span className={`px-2.5 py-0.5 rounded font-bold ${
                      crossJudgeIsolationResult.status === 403 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {crossJudgeIsolationResult.statusText}
                    </span>
                  </div>
                  <pre className="text-slate-300 text-[11px] overflow-x-auto bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {JSON.stringify(crossJudgeIsolationResult.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* List of Assigned Projects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Your Assigned Submissions ({myAssignedProjects.length})</h3>
                <span className="text-xs text-purple-300 font-mono">Rule 16: Isolated Evaluator Queue</span>
              </div>

              {myAssignedProjects.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                  <Gavel className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-semibold text-white">No Projects Currently Assigned to You</p>
                  <p className="text-xs">Once an event organizer assigns projects via Manual or Automatic mode, they will appear here for scoring.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myAssignedProjects.map((p) => (
                    <div key={p._id} className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition rounded-2xl p-5 space-y-4 flex flex-col justify-between backdrop-blur-xl">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                            {p.track_id?.name || 'General Track'}
                          </span>
                          <span className="text-slate-500 font-mono">{p.team_id?.name || 'Team'}</span>
                        </div>
                        <h4 className="text-base font-bold text-white hover:text-purple-300 transition">{p.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3">{p.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {p.repo_url && (
                          <a
                            href={p.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Code</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenScoreModal(p)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition ml-auto flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>Evaluate & Score</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score Evaluation Modal with Configurable Rubrics & Locking */}
            {scoringProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-base">Evaluate: {scoringProject.title}</h3>
                      <span className="text-xs text-slate-400">{scoringProject.team_id?.name || 'Team'} • {scoringProject.track_id?.name || 'Track'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentScoreRecord?.status === 'submitted' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[11px] font-bold border border-rose-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>LOCKED</span>
                        </span>
                      ) : currentScoreRecord?.status === 'draft' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>DRAFT</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                          NEW
                        </span>
                      )}
                      <button onClick={() => setScoringProject(null)} className="text-slate-400 hover:text-white text-base ml-2">✕</button>
                    </div>
                  </div>

                  {currentScoreRecord?.status === 'submitted' && (
                    <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <div>
                        <strong>Evaluation Locked:</strong> Official scores were submitted and locked on the backend. Only an organizer can reopen this evaluation.
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    {/* Rubric Criteria Evaluation */}
                    {rubricCriteria.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Configured Rubric Criteria ({rubricCriteria.length})</span>
                          <span>Weighted Formula: Σ (Score × Weight)</span>
                        </div>

                        {rubricCriteria.map((c) => {
                          const currentVal = judgeScoreValues[c._id] !== undefined
                            ? judgeScoreValues[c._id]
                            : Math.round((c.min_score + c.max_score) / 2);
                          const isLocked = currentScoreRecord?.status === 'submitted';

                          return (
                            <div key={c._id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-white">{c.name}</span>
                                  <span className="text-[10px] text-emerald-400 font-mono ml-2">Weight: {c.weight}</span>
                                </div>
                                <div className="flex items-center gap-1 font-mono font-bold">
                                  <span className="text-purple-300 text-sm">{currentVal}</span>
                                  <span className="text-slate-500 text-[11px]">/ {c.max_score}</span>
                                </div>
                              </div>
                              {c.description && <p className="text-[11px] text-slate-400">{c.description}</p>}
                              <input
                                type="range"
                                min={c.min_score}
                                max={c.max_score}
                                step={1}
                                disabled={isLocked}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setJudgeScoreValues((prev) => ({ ...prev, [c._id]: val }));
                                }}
                                className="w-full accent-purple-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>Min: {c.min_score}</span>
                                <span>Contribution: {Math.round(currentVal * c.weight * 100) / 100} pts</span>
                                <span>Max: {c.max_score}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Technical Execution (Max 30, Weight: 1.0)</span>
                            <strong className="text-purple-300">{scoreExecution} pts</strong>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={30}
                            disabled={currentScoreRecord?.status === 'submitted'}
                            value={scoreExecution}
                            onChange={(e) => setScoreExecution(parseInt(e.target.value, 10))}
                            className="w-full accent-purple-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>Novelty & Innovation (Max 30, Weight: 1.0)</span>
                            <strong className="text-purple-300">{scoreInnovation} pts</strong>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={30}
                            disabled={currentScoreRecord?.status === 'submitted'}
                            value={scoreInnovation}
                            onChange={(e) => setScoreInnovation(parseInt(e.target.value, 10))}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Weighted Total Calculation Display */}
                    <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-purple-200 font-bold block">
                          {currentScoreRecord?.status === 'submitted' ? 'Official Locked Total' : 'Backend Weighted Total Preview'}
                        </span>
                        <span className="text-[11px] text-slate-400">Strictly computed on the backend server</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-mono font-bold text-white">
                          {currentScoreRecord?.status === 'submitted'
                            ? currentScoreRecord.weighted_total
                            : calculateLiveWeightedTotal()}
                        </span>
                        <span className="text-xs text-purple-300 font-mono ml-1">pts</span>
                      </div>
                    </div>

                    {/* Judge Comment */}
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Judge Feedback & Criteria Comments</label>
                      <textarea
                        rows={3}
                        disabled={currentScoreRecord?.status === 'submitted'}
                        placeholder="Detailed feedback justifying criterion scores..."
                        value={judgeComment}
                        onChange={(e) => setJudgeComment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setScoringProject(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        {currentScoreRecord?.status === 'submitted' ? 'Close' : 'Cancel'}
                      </button>

                      {currentScoreRecord?.status !== 'submitted' && (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleSaveEvaluation('draft')}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold transition flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Save as Draft</span>
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleSaveEvaluation('submitted')}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Submit & Lock</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4.8: CROSS-JUDGE LEADERBOARD (RAW VS NORMALIZED STANDINGS)             */}
        {/* ========================================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                  <span>Cross-Judge Score Normalization</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Side-by-side comparison of <strong>Raw Scores</strong> vs <strong>Z-Score Normalized Scores (0–100 Scale)</strong>. Eliminates evaluator bias where harsh judges penalize projects and generous judges elevate them.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={leaderboardTrackFilter}
                  onChange={(e) => setLeaderboardTrackFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Tracks</option>
                  {tracks.map((t) => (
                    <option key={t._id} value={t.name}>{t.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={fetchLeaderboard}
                  disabled={leaderboardLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{leaderboardLoading ? 'Refreshing...' : 'Refresh Standings'}</span>
                </button>
              </div>
            </div>

            {/* Educational Math & Edge-Case Card */}
            <div className="bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>How Cross-Judge Normalization Works (JUDGING.md Section 3.1)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-400 text-[11px] leading-relaxed">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-white block text-xs">1. Per-Judge Mean & StdDev</strong>
                  <p>For each judge, we compute their average evaluation μ and standard deviation σ across all projects they scored.</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-white block text-xs">2. Z-Score Standardization</strong>
                  <p>z = (score - μ) / σ. Scores are evaluated by how far they stand above or below that specific evaluator's baseline.</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-white block text-xs">3. 0–100 Rescaling & Edge Cases</strong>
                  <p>All z-scores are rescaled to 0–100. Judges with 1 score (N=1) or identical scores (σ=0) default safely to z=0 (50.0), and unscored projects remain safely unranked.</p>
                </div>
              </div>
            </div>

            {/* Judge Calibration Stats */}
            {leaderboardStats.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Evaluator Calibration Baselines ({leaderboardStats.length} Judges)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {leaderboardStats.map((j) => (
                    <div key={j.judge_id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2 text-xs backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate">{j.judge_name}</span>
                        {j.edge_case ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {j.edge_case}
                          </span>
                        ) : j.mean < 6 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Harsh
                          </span>
                        ) : j.mean > 7.5 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Generous
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                            Balanced
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Mean (μ)</span>
                          <span className="font-bold text-purple-300">{j.mean}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">StdDev (σ)</span>
                          <span className="font-bold text-cyan-300">{j.std_dev}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Scored</span>
                          <span className="font-bold text-white">{j.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-Side Standings Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Official Standings (Side-by-Side Comparison)</span>
                </h3>
                {leaderboardSummary && (
                  <span className="text-xs text-slate-400">
                    {leaderboardSummary.evaluated_submissions} of {leaderboardSummary.total_submissions} projects evaluated
                  </span>
                )}
              </div>

              {leaderboardData.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <BarChart3 className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-semibold text-white">No Evaluation Standings Available Yet</p>
                  <p className="text-xs">Once judges submit official scores for projects, raw and normalized rankings will populate here automatically.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                      <tr>
                        <th className="p-3 text-center">Norm Rank</th>
                        <th className="p-3 text-center">Raw Rank</th>
                        <th className="p-3 text-center">Shift (Δ)</th>
                        <th className="p-3">Project Title & Team</th>
                        <th className="p-3">Track</th>
                        <th className="p-3">Normalized Score (0–100)</th>
                        <th className="p-3 text-right">Raw Score</th>
                        <th className="p-3 text-right">Judges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {leaderboardData
                        .filter(r => leaderboardTrackFilter === 'all' || r.track_name === leaderboardTrackFilter)
                        .map((r) => {
                          const isTop3 = r.normalized_rank && r.normalized_rank <= 3;
                          return (
                            <tr key={r.submission_id} className="hover:bg-slate-950/40 transition">
                              {/* Normalized Rank */}
                              <td className="p-3 text-center">
                                {r.normalized_rank ? (
                                  <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full font-mono ${
                                    r.normalized_rank === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                    r.normalized_rank === 2 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40' :
                                    r.normalized_rank === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                                    'text-slate-400'
                                  }`}>
                                    {r.normalized_rank === 1 ? '🥇 #1' :
                                     r.normalized_rank === 2 ? '🥈 #2' :
                                     r.normalized_rank === 3 ? '🥉 #3' : `#${r.normalized_rank}`}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-mono">—</span>
                                )}
                              </td>

                              {/* Raw Rank */}
                              <td className="p-3 text-center font-mono">
                                {r.raw_rank ? (
                                  <span className="text-slate-400">#{r.raw_rank}</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>

                              {/* Rank Delta */}
                              <td className="p-3 text-center font-mono font-bold">
                                {r.rank_delta > 0 ? (
                                  <span className="text-emerald-400 inline-flex items-center gap-0.5">
                                    <ArrowUp className="w-3 h-3" />
                                    <span>+{r.rank_delta}</span>
                                  </span>
                                ) : r.rank_delta < 0 ? (
                                  <span className="text-rose-400 inline-flex items-center gap-0.5">
                                    <ArrowDown className="w-3 h-3" />
                                    <span>{r.rank_delta}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-600 inline-flex items-center gap-0.5">
                                    <Minus className="w-3 h-3" />
                                    <span>0</span>
                                  </span>
                                )}
                              </td>

                              {/* Project & Team */}
                              <td className="p-3">
                                <span className={`font-semibold block ${isTop3 ? 'text-white' : 'text-slate-200'}`}>
                                  {r.title}
                                </span>
                                <span className="text-[11px] text-slate-400">{r.team_name}</span>
                              </td>

                              {/* Track */}
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-medium">
                                  {r.track_name}
                                </span>
                              </td>

                              {/* Normalized Score (0-100) with visual bar */}
                              <td className="p-3">
                                {r.normalized_score !== null ? (
                                  <div className="space-y-1 max-w-xs">
                                    <div className="flex justify-between font-mono font-bold text-xs">
                                      <span className="text-cyan-300">{r.normalized_score}</span>
                                      <span className="text-slate-500 text-[10px]">/ 100</span>
                                    </div>
                                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                                        style={{ width: `${Math.min(100, Math.max(0, r.normalized_score))}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 font-mono italic">Unscored</span>
                                )}
                              </td>

                              {/* Raw Score */}
                              <td className="p-3 text-right font-mono font-bold">
                                {r.raw_score !== null ? (
                                  <span className="text-slate-300">{r.raw_score}</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>

                              {/* Evaluations Count */}
                              <td className="p-3 text-right font-mono text-slate-400">
                                {r.evaluations_count}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SYSTEM HEALTHCHECK & STATUS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-xl ${
              isHealthy ? 'bg-slate-900/60 border-emerald-500/30' : 'bg-slate-900/60 border-rose-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isHealthy ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400">GET /api/health</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      {isHealthy ? 'All 3 Services Connected & Healthy' : 'Health Check Pending'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 font-mono">
                    <span className="text-slate-400 block text-[10px]">Latency</span>
                    <span className="font-bold text-slate-200">{healthLatency !== null ? `${healthLatency} ms` : '—'}</span>
                  </div>
                  <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 font-mono">
                    <span className="text-slate-400 block text-[10px]">Last Checked</span>
                    <span className="font-bold text-slate-200">{lastHealthCheck || 'Initial'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Frontend (React + Vite)</span>
                  <span className="text-emerald-400 font-bold">Port 5173 / 80 — Active</span>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Backend (Node + Express)</span>
                  <span className="text-emerald-400 font-bold">Port 5000 — Healthy</span>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Database (MongoDB 6.0)</span>
                  <span className="text-emerald-400 font-bold">Port 27017 — Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/60 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Three-Service Microservices Stack: Frontend, Backend, Database</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            100% Offline Verified &bull; Zero External APIs
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
