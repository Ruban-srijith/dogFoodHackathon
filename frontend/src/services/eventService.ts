import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Event } from '../types';

export const UNSTOP_PRODUCT_DEV_HACKATHONS: Event[] = [
  {
    id: 'unstop-prod-dev-01',
    title: 'Unstop Product Pro Hackathon 2026',
    slug: 'unstop-product-pro-2026',
    description: 'National Level Product Development & Innovation Challenge hosted by Unstop. Teams design, prototype, and build end-to-end digital product MVPs featuring AI workflows, modern user experience, and scalable backend architecture.',
    start_date: '2026-09-20T00:00:00Z',
    end_date: '2026-10-15T00:00:00Z',
    submission_deadline: '2026-10-12T23:59:59Z',
    status: 'ongoing',
    location: 'Unstop Platform / Virtual Global',
    created_by: 'unstop-admin-01',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-20T00:00:00Z',
    tracks: [
      {
        id: 'track-pd-1',
        event_id: 'unstop-prod-dev-01',
        name: 'AI & SaaS Product Innovation',
        description: 'Build user-first generative AI products and workflow automation tools.',
        prize_pool: '$1,500 + Unstop Pro Badges',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
      {
        id: 'track-pd-2',
        event_id: 'unstop-prod-dev-01',
        name: 'Developer Tools & Telemetry',
        description: 'Design self-hostable developer platforms, monitoring dashboards, and APIs.',
        prize_pool: '$1,000 + Cloud Credits',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
      },
    ],
  },
  {
    id: 'unstop-prod-dev-02',
    title: 'Unstop AI Product Development Sprint',
    slug: 'unstop-ai-product-sprint',
    description: 'High-speed 48-hour Product Management & Product Engineering Sprint on Unstop. Transform complex problem statements into production-ready web and mobile product experiences.',
    start_date: '2026-09-10T00:00:00Z',
    end_date: '2026-10-05T00:00:00Z',
    submission_deadline: '2026-10-04T23:59:59Z',
    status: 'voting',
    location: 'Unstop Digital Arena / Remote',
    created_by: 'unstop-admin-02',
    created_at: '2026-09-05T00:00:00Z',
    updated_at: '2026-09-10T00:00:00Z',
    tracks: [
      {
        id: 'track-ai-sprint-1',
        event_id: 'unstop-prod-dev-02',
        name: 'Full-Stack Product Architecture',
        description: 'End-to-end full-stack product implementation.',
        prize_pool: '$2,000 Cash Prize',
        created_at: '2026-09-05T00:00:00Z',
        updated_at: '2026-09-05T00:00:00Z',
      },
    ],
  },
  {
    id: 'unstop-prod-dev-03',
    title: 'FinTech & E-Commerce Product Challenge',
    slug: 'fintech-ecommerce-product-hackathon',
    description: 'Product Development Hackathon sponsored by Unstop Industry Partners. Engineer friction-less checkout flows, smart payment telemetry, and real-time merchant analytics dashboards.',
    start_date: '2026-10-01T00:00:00Z',
    end_date: '2026-10-25T00:00:00Z',
    submission_deadline: '2026-10-20T23:59:59Z',
    status: 'published',
    location: 'Unstop Platform / Global',
    created_by: 'unstop-admin-03',
    created_at: '2026-09-15T00:00:00Z',
    updated_at: '2026-09-15T00:00:00Z',
    tracks: [
      {
        id: 'track-fin-1',
        event_id: 'unstop-prod-dev-03',
        name: 'Next-Gen Financial Products',
        description: 'Innovative payment systems and decentralized telemetry.',
        prize_pool: '$3,000 Pool',
        created_at: '2026-09-15T00:00:00Z',
        updated_at: '2026-09-15T00:00:00Z',
      },
    ],
  },
];

export const eventService = {
  getPublicEvents: async (): Promise<Event[]> => {
    try {
      const data = await apiClient.get<Event[]>(ENDPOINTS.EVENTS);
      return data && data.length > 0 ? data : UNSTOP_PRODUCT_DEV_HACKATHONS;
    } catch {
      // Fallback to Unstop Product Development Hackathons if backend API is offline
      return UNSTOP_PRODUCT_DEV_HACKATHONS;
    }
  },

  getAllEvents: async (status?: string): Promise<Event[]> => {
    try {
      const url = status ? `${ENDPOINTS.ALL_EVENTS}?status=${status}` : ENDPOINTS.ALL_EVENTS;
      const data = await apiClient.get<Event[]>(url);
      return data && data.length > 0 ? data : UNSTOP_PRODUCT_DEV_HACKATHONS;
    } catch {
      return UNSTOP_PRODUCT_DEV_HACKATHONS;
    }
  },

  getEventByIdOrSlug: async (idOrSlug: string): Promise<Event> => {
    try {
      return await apiClient.get<Event>(ENDPOINTS.EVENT_BY_ID(idOrSlug));
    } catch {
      const found = UNSTOP_PRODUCT_DEV_HACKATHONS.find(
        (e) => e.id === idOrSlug || e.slug === idOrSlug
      );
      return found || UNSTOP_PRODUCT_DEV_HACKATHONS[0];
    }
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    return await apiClient.post<Event>(ENDPOINTS.EVENTS, data);
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    return await apiClient.patch<Event>(ENDPOINTS.EVENT_BY_ID(id), data);
  },
};
