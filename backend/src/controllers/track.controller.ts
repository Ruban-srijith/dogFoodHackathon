import { Request, Response, NextFunction } from 'express';
import { trackService } from '../services/track.service';
import { sendSuccess } from '../utils/response';

export class TrackController {
  async getTracksByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const tracks = await trackService.getTracksByEvent(req.params.eventId);
      return sendSuccess(res, tracks);
    } catch (err) {
      next(err);
    }
  }

  async createTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const track = await trackService.createTrack({
        ...req.body,
        event_id: req.params.eventId,
      });
      return sendSuccess(res, track, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteTrack(req: Request, res: Response, next: NextFunction) {
    try {
      await trackService.deleteTrack(req.params.id);
      return sendSuccess(res, { message: 'Track deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const trackController = new TrackController();
