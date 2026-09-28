import { trackRepository } from '../repositories/track.repository';
import { eventRepository } from '../repositories/event.repository';
import { NotFoundError } from '../utils/errors';
import { Track } from '../models';

export class TrackService {
  async getTracksByEvent(eventId: string): Promise<Track[]> {
    return await trackRepository.findByEventId(eventId);
  }

  async createTrack(data: { event_id: string; name: string; description?: string | null; prize_pool?: string | null }): Promise<Track> {
    const event = await eventRepository.findById(data.event_id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return await trackRepository.create(data);
  }

  async deleteTrack(id: string): Promise<void> {
    const success = await trackRepository.delete(id);
    if (!success) {
      throw new NotFoundError('Track not found');
    }
  }
}

export const trackService = new TrackService();
