import { eventRepository } from '../repositories/event.repository';
import { trackRepository } from '../repositories/track.repository';
import { rubricRepository } from '../repositories/rubric.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { auditService } from './audit.service';
import { Event, EventStatus } from '../models';

export class EventService {
  async listPublicEvents(): Promise<Event[]> {
    return await eventRepository.listPublished();
  }

  async listAllEvents(status?: EventStatus): Promise<Event[]> {
    return await eventRepository.listAll(status);
  }

  async getEventById(id: string): Promise<Event> {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return event;
  }

  async getEventBySlug(slug: string): Promise<Event> {
    const event = await eventRepository.findBySlug(slug);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return event;
  }

  async getEventDetails(identifier: string): Promise<any> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const event = isUuid ? await eventRepository.findById(identifier) : await eventRepository.findBySlug(identifier);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const [tracks, rubric] = await Promise.all([
      trackRepository.findByEventId(event.id),
      rubricRepository.findByEventId(event.id),
    ]);

    return {
      ...event,
      tracks,
      rubric,
    };
  }

  async createEvent(data: {
    title: string;
    slug: string;
    description: string;
    start_date: string;
    end_date: string;
    submission_deadline: string;
    status?: EventStatus;
    banner_url?: string | null;
    location?: string | null;
    created_by: string;
  }): Promise<Event> {
    const existing = await eventRepository.findBySlug(data.slug);
    if (existing) {
      throw new ConflictError('An event with this slug already exists');
    }

    const event = await eventRepository.create(data);

    // Automatically create default rubric for the event
    const rubric = await rubricRepository.create({
      event_id: event.id,
      name: `${event.title} Official Rubric`,
      description: 'Standard evaluation rubric for judges',
      max_score: 100,
    });

    // Add standard criteria
    await Promise.all([
      rubricRepository.addCriterion({ rubric_id: rubric.id, name: 'Innovation & Originality', weight: 1.0, max_points: 25 }),
      rubricRepository.addCriterion({ rubric_id: rubric.id, name: 'Technical Execution & Depth', weight: 1.0, max_points: 25 }),
      rubricRepository.addCriterion({ rubric_id: rubric.id, name: 'Design & User Experience', weight: 1.0, max_points: 25 }),
      rubricRepository.addCriterion({ rubric_id: rubric.id, name: 'Impact & Practicality', weight: 1.0, max_points: 25 }),
    ]);

    await auditService.log({
      user_id: data.created_by,
      action: 'EVENT_CREATED',
      entity_type: 'event',
      entity_id: event.id,
      details: { title: event.title, slug: event.slug },
    });

    return event;
  }

  async updateEvent(id: string, data: Partial<Event>, userId: string): Promise<Event> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await eventRepository.findBySlug(data.slug);
      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictError('An event with this slug already exists');
      }
    }

    const updated = await eventRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Failed to update event');
    }

    if (data.status && data.status !== existing.status) {
      await auditService.log({
        user_id: userId,
        action: 'EVENT_STATUS_CHANGED',
        entity_type: 'event',
        entity_id: id,
        details: { previousStatus: existing.status, newStatus: data.status },
      });
    } else {
      await auditService.log({
        user_id: userId,
        action: 'EVENT_UPDATED',
        entity_type: 'event',
        entity_id: id,
        details: data,
      });
    }

    return updated;
  }
}

export const eventService = new EventService();
