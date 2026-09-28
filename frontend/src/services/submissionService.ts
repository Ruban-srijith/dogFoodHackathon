import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Submission } from '../types';

export const UNSTOP_PRODUCT_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-unstop-01',
    event_id: 'unstop-prod-dev-01',
    team_id: 'team-01',
    title: 'Unstop Flow Studio',
    tagline: 'AI-Powered No-Code Product Development Platform',
    description: 'An interactive product design and workflow engine that compiles wireframes into production React components in real time.',
    repo_url: 'https://github.com/Ruban-srijith/dogFoodHackathon',
    demo_url: 'https://unstop.org',
    tech_stack: ['React', 'TypeScript', 'TailwindCSS', 'Node.js', 'PostgreSQL'],
    status: 'submitted',
    submitted_at: '2026-09-25T14:30:00Z',
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-25T14:30:00Z',
    team_name: 'Product Vanguard',
    track_name: 'AI & SaaS Product Innovation',
    vote_count: 42,
  },
  {
    id: 'sub-unstop-02',
    event_id: 'unstop-prod-dev-01',
    team_id: 'team-02',
    title: 'Telemetry Mesh Pro',
    tagline: 'Self-Hostable Product Analytics & Health Dashboard',
    description: 'Real-time telemetry and error tracking suite engineered for microservice products with zero cloud dependencies.',
    repo_url: 'https://github.com/Ruban-srijith/dogFoodHackathon',
    demo_url: 'https://unstop.org',
    tech_stack: ['TypeScript', 'Docker', 'Express', 'Vite', 'TailwindCSS'],
    status: 'submitted',
    submitted_at: '2026-09-26T18:00:00Z',
    created_at: '2026-09-21T09:00:00Z',
    updated_at: '2026-09-26T18:00:00Z',
    team_name: 'CyberCrafters',
    track_name: 'Developer Tools & Telemetry',
    vote_count: 29,
  },
];

export const submissionService = {
  getGallery: async (eventId: string): Promise<Submission[]> => {
    try {
      const data = await apiClient.get<Submission[]>(ENDPOINTS.GALLERY(eventId));
      return data && data.length > 0 ? data : UNSTOP_PRODUCT_SUBMISSIONS;
    } catch {
      return UNSTOP_PRODUCT_SUBMISSIONS;
    }
  },

  getEventSubmissions: async (eventId: string): Promise<Submission[]> => {
    try {
      const data = await apiClient.get<Submission[]>(ENDPOINTS.SUBMISSIONS_BY_EVENT(eventId));
      return data && data.length > 0 ? data : UNSTOP_PRODUCT_SUBMISSIONS;
    } catch {
      return UNSTOP_PRODUCT_SUBMISSIONS;
    }
  },

  getSubmissionById: async (id: string): Promise<Submission> => {
    try {
      return await apiClient.get<Submission>(ENDPOINTS.SUBMISSION_BY_ID(id));
    } catch {
      const found = UNSTOP_PRODUCT_SUBMISSIONS.find((s) => s.id === id);
      return found || UNSTOP_PRODUCT_SUBMISSIONS[0];
    }
  },

  createSubmission: async (data: Partial<Submission>): Promise<Submission> => {
    return await apiClient.post<Submission>(ENDPOINTS.CREATE_SUBMISSION, data);
  },

  updateSubmission: async (id: string, data: Partial<Submission>): Promise<Submission> => {
    return await apiClient.patch<Submission>(ENDPOINTS.UPDATE_SUBMISSION(id), data);
  },
};
