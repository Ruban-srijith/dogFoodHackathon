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
  Lock
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

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'gallery' | 'teams' | 'submit' | 'judging' | 'organizer' | 'health'>('gallery');

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
  const [scoreFeedback, setScoreFeedback] = useState('Excellent technical execution and clean architecture.');

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

  useEffect(() => {
    checkHealth();
    fetchEventsAndTracks();
    fetchGallery();
  }, [checkHealth, fetchEventsAndTracks, fetchGallery]);

  // 5. Fetch Judge Data & Assignments
  const fetchJudgingData = useCallback(async () => {
    if (!authToken) return;
    const base = getBaseApiUrl();

    try {
      if (authUser?.role === 'ORGANIZER' || authUser?.role === 'ADMIN') {
        const [invRes, jRes, asgnRes] = await Promise.all([
          fetch(`${base}/api/judges/invites`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`${base}/api/judges`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
          fetch(`${base}/api/judges/assignments`, { headers: { 'Authorization': `Bearer ${authToken}` } })
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

  // T2 Handlers: Score Evaluation
  const handleScoreProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !scoringProject) return;
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
          scores: { innovation: scoreInnovation, execution: scoreExecution },
          feedback: scoreFeedback
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Evaluation for "${scoringProject.title}" saved successfully!`, 'success');
        setScoringProject(null);
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

            {/* Active Assignments Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-purple-400" />
                  <span>Current Project Assignments ({allAssignments.length})</span>
                </h3>
                <span className="text-xs text-slate-400">Organizers view all evaluation assignments</span>
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
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                              {a.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleUnassign(a._id)}
                              className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold transition"
                            >
                              Unassign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

            {/* Interactive 403 Security Verification Card */}
            <div className="bg-slate-900/60 border border-purple-500/30 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4 text-rose-400" />
                    Interactive Security Verification: Judge Isolation (Rule 16)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify that the backend rejects access to unassigned projects with <strong>HTTP 403 Forbidden</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestJudgeIsolation}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Attempt 403 Request (Unassigned Project)</span>
                </button>
              </div>

              {judgeIsolationTestResult && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Project: <strong className="text-white">{judgeIsolationTestResult.targetTitle}</strong></span>
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
                          onClick={() => setScoringProject(p)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition ml-auto"
                        >
                          Evaluate & Score
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score Evaluation Modal */}
            {scoringProject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-base">Evaluate: {scoringProject.title}</h3>
                    <button onClick={() => setScoringProject(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <form onSubmit={handleScoreProject} className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Technical Execution (Max 30)</span>
                        <strong className="text-purple-300">{scoreExecution} pts</strong>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={scoreExecution}
                        onChange={(e) => setScoreExecution(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Novelty & Innovation (Max 30)</span>
                        <strong className="text-purple-300">{scoreInnovation} pts</strong>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={scoreInnovation}
                        onChange={(e) => setScoreInnovation(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Judge Feedback & Notes</label>
                      <textarea
                        rows={3}
                        value={scoreFeedback}
                        onChange={(e) => setScoreFeedback(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setScoringProject(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition"
                      >
                        Submit Official Score
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
