import { Router } from 'express';
import { trackController } from '../controllers/track.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createTrackSchema } from '../schemas';

const router = Router();

router.get('/event/:eventId', trackController.getTracksByEvent);
router.post('/event/:eventId', authenticate, authorize(['ORGANIZER', 'ADMIN']), validate(createTrackSchema), trackController.createTrack);
router.delete('/:id', authenticate, authorize(['ORGANIZER', 'ADMIN']), trackController.deleteTrack);

export default router;
