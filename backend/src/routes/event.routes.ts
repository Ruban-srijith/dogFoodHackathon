import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createEventSchema, updateEventSchema } from '../schemas';

const router = Router();

// Public event listing
router.get('/', optionalAuthenticate, eventController.listPublicEvents);

// Organizer/Admin all events listing (including drafts)
router.get('/all', authenticate, authorize(['ORGANIZER', 'ADMIN']), eventController.listAllEvents);

// Event details by id or slug
router.get('/:id', optionalAuthenticate, eventController.getEvent);

// Create event (Organizer / Admin)
router.post('/', authenticate, authorize(['ORGANIZER', 'ADMIN']), validate(createEventSchema), eventController.createEvent);

// Update event (Organizer / Admin)
router.patch('/:id', authenticate, authorize(['ORGANIZER', 'ADMIN']), validate(updateEventSchema), eventController.updateEvent);

export default router;
