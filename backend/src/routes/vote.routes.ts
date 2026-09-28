import { Router } from 'express';
import { voteController } from '../controllers/vote.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';
import { castVoteSchema } from '../schemas';

const router = Router();

const voteLimiter = rateLimiter({ maxRequests: 20, windowSeconds: 60 });

router.post('/', authenticate, voteLimiter, validate(castVoteSchema), voteController.castVote);
router.get('/event/:eventId/leaderboard', voteController.getLeaderboard);
router.get('/event/:eventId/me', authenticate, voteController.getMyVote);

export default router;
