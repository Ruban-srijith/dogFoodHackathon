import { Router } from 'express';
import { submissionController } from '../controllers/submission.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';
import { createSubmissionSchema, updateSubmissionSchema } from '../schemas';

const router = Router();

const submissionLimiter = rateLimiter({ maxRequests: 20, windowSeconds: 60 });

router.get('/gallery/:eventId', submissionController.listGallery);
router.get('/event/:eventId', optionalAuthenticate, submissionController.listEventSubmissions);
router.get('/:id', optionalAuthenticate, submissionController.getSubmission);
router.post(
  '/',
  authenticate,
  authorize(['PARTICIPANT', 'ORGANIZER', 'ADMIN']),
  submissionLimiter,
  validate(createSubmissionSchema),
  submissionController.createSubmission
);
router.patch(
  '/:id',
  authenticate,
  authorize(['PARTICIPANT', 'ORGANIZER', 'ADMIN']),
  submissionLimiter,
  validate(updateSubmissionSchema),
  submissionController.updateSubmission
);

export default router;
