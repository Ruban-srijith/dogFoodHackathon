import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Event } from '../types';

export const eventService = {
  getPublicEvents: async (): Promise<Event[]> => {
    return await apiClient.get<Event[]>(ENDPOINTS.EVENTS);
  },

  getAllEvents: async (status?: string): Promise<Event[]> => {
    const url = status ? `${ENDPOINTS.ALL_EVENTS}?status=${status}` : ENDPOINTS.ALL_EVENTS;
    return await apiClient.get<Event[]>(url);
  },

  getEventByIdOrSlug: async (idOrSlug: string): Promise<Event> => {
    return await apiClient.get<Event>(ENDPOINTS.EVENT_BY_ID(idOrSlug));
  },

  createEvent: async (data: Partial<Event>): Promise<Event> => {
    return await apiClient.post<Event>(ENDPOINTS.EVENTS, data);
  },

  updateEvent: async (id: string, data: Partial<Event>): Promise<Event> => {
    return await apiClient.patch<Event>(ENDPOINTS.EVENT_BY_ID(id), data);
  },
};
