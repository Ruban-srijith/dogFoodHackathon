import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createTeamSchema, joinTeamSchema } from '../schemas';

const router = Router();

router.get('/event/:eventId', teamController.listTeams);
router.get('/event/:eventId/me', authenticate, teamController.getMyTeam);
router.get('/:id', teamController.getTeam);
router.post('/', authenticate, authorize(['PARTICIPANT', 'ORGANIZER', 'ADMIN']), validate(createTeamSchema), teamController.createTeam);
router.post('/join', authenticate, authorize(['PARTICIPANT', 'ORGANIZER', 'ADMIN']), validate(joinTeamSchema), teamController.joinTeam);

export default router;
