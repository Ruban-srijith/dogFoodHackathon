import { Router } from 'express';
import { scoreController } from '../controllers/score.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { submitScoreSchema } from '../schemas';

const router = Router();

// Submit/update score on criterion (Judge evaluating assigned submission)
router.post(
  '/submission/:submissionId',
  authenticate,
  authorize(['JUDGE', 'ORGANIZER', 'ADMIN']),
  validate(submitScoreSchema),
  scoreController.submitScore
);

// View judge's own scores for submission
router.get(
  '/submission/:submissionId',
  authenticate,
  authorize(['JUDGE', 'ORGANIZER', 'ADMIN']),
  scoreController.getMyScoresForSubmission
);

// View aggregate scores and leaderboard (Organizer & Admin)
router.get(
  '/event/:eventId/results',
  authenticate,
  authorize(['ORGANIZER', 'ADMIN']),
  scoreController.getEventResults
);

export default router;
