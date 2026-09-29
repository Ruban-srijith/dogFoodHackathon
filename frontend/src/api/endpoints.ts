const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isRemote = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    // If accessing from another computer/device over LAN, ignore any hardcoded localhost URL
    if (isRemote && envUrl && envUrl.includes('localhost')) {
      return '/api/v1';
    }
  }
  return envUrl || '/api/v1';
};

export const BASE_URL = getBaseUrl();

export const ENDPOINTS = {
  // Auth
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  LOGOUT: `${BASE_URL}/auth/logout`,
  ME: `${BASE_URL}/auth/me`,

  // Users
  USERS: `${BASE_URL}/users`,
  USER_BY_ID: (id: string) => `${BASE_URL}/users/${id}`,
  USER_ROLE: (id: string) => `${BASE_URL}/users/${id}/role`,

  // Events
  EVENTS: `${BASE_URL}/events`,
  ALL_EVENTS: `${BASE_URL}/events/all`,
  EVENT_BY_ID: (id: string) => `${BASE_URL}/events/${id}`,

  // Tracks
  TRACKS_BY_EVENT: (eventId: string) => `${BASE_URL}/tracks/event/${eventId}`,
  TRACK_BY_ID: (id: string) => `${BASE_URL}/tracks/${id}`,

  // Teams
  TEAMS_BY_EVENT: (eventId: string) => `${BASE_URL}/teams/event/${eventId}`,
  MY_TEAM_IN_EVENT: (eventId: string) => `${BASE_URL}/teams/event/${eventId}/me`,
  TEAM_BY_ID: (id: string) => `${BASE_URL}/teams/${id}`,
  CREATE_TEAM: `${BASE_URL}/teams`,
  JOIN_TEAM: `${BASE_URL}/teams/join`,

  // Submissions
  GALLERY: (eventId: string) => `${BASE_URL}/submissions/gallery/${eventId}`,
  SUBMISSIONS_BY_EVENT: (eventId: string) => `${BASE_URL}/submissions/event/${eventId}`,
  SUBMISSION_BY_ID: (id: string) => `${BASE_URL}/submissions/${id}`,
  CREATE_SUBMISSION: `${BASE_URL}/submissions`,
  UPDATE_SUBMISSION: (id: string) => `${BASE_URL}/submissions/${id}`,

  // Judging
  JUDGE_ASSIGNMENTS: `${BASE_URL}/judges/assignments`,
  JUDGE_SUBMISSION_DETAIL: (submissionId: string) => `${BASE_URL}/judges/submissions/${submissionId}`,
  EVENT_ASSIGNMENTS: (eventId: string) => `${BASE_URL}/judges/event/${eventId}/assignments`,
  ASSIGN_JUDGE: `${BASE_URL}/judges/assign`,
  REMOVE_ASSIGNMENT: (id: string) => `${BASE_URL}/judges/assignments/${id}`,

  // Scores
  SUBMIT_SCORE: (submissionId: string) => `${BASE_URL}/scores/submission/${submissionId}`,
  MY_SCORES: (submissionId: string) => `${BASE_URL}/scores/submission/${submissionId}`,
  EVENT_RESULTS: (eventId: string) => `${BASE_URL}/scores/event/${eventId}/results`,

  // Votes
  CAST_VOTE: `${BASE_URL}/votes`,
  VOTE_LEADERBOARD: (eventId: string) => `${BASE_URL}/votes/event/${eventId}/leaderboard`,
  MY_VOTE: (eventId: string) => `${BASE_URL}/votes/event/${eventId}/me`,

  // Comments
  COMMENTS_BY_SUBMISSION: (submissionId: string) => `${BASE_URL}/comments/submission/${submissionId}`,
  DELETE_COMMENT: (id: string) => `${BASE_URL}/comments/${id}`,

  // Admin
  AUDIT_LOGS: `${BASE_URL}/admin/audit`,
  PLATFORM_STATS: `${BASE_URL}/admin/stats`,
};
