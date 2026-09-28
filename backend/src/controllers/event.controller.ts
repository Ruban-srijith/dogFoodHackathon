import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service';
import { sendSuccess } from '../utils/response';
import { EventStatus } from '../models';

export class EventController {
  async listPublicEvents(_req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventService.listPublicEvents();
      return sendSuccess(res, events);
    } catch (err) {
      next(err);
    }
  }

  async listAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as EventStatus | undefined;
      const events = await eventService.listAllEvents(status);
      return sendSuccess(res, events);
    } catch (err) {
      next(err);
    }
  }

  async getEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.getEventDetails(req.params.id);
      return sendSuccess(res, event);
    } catch (err) {
      next(err);
    }
  }

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.createEvent({
        ...req.body,
        created_by: req.user!.userId,
      });
      return sendSuccess(res, event, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.updateEvent(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, event);
    } catch (err) {
      next(err);
    }
  }
}

export const eventController = new EventController();
