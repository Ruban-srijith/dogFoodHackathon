import { Router } from 'express';
import { judgeController } from '../controllers/judge.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { assignJudgeSchema } from '../schemas';

const router = Router();

// Judge's own assigned submissions (Rule 16: Judging Isolation)
router.get('/assignments', authenticate, authorize(['JUDGE', 'ORGANIZER', 'ADMIN']), judgeController.getMyAssignments);
router.get('/submissions/:submissionId', authenticate, authorize(['JUDGE', 'ORGANIZER', 'ADMIN']), judgeController.getSubmissionForJudging);

// Organizer & Admin judge assignment management
router.get('/event/:eventId/assignments', authenticate, authorize(['ORGANIZER', 'ADMIN']), judgeController.listEventAssignments);
router.post('/assign', authenticate, authorize(['ORGANIZER', 'ADMIN']), validate(assignJudgeSchema), judgeController.assignJudge);
router.delete('/assignments/:id', authenticate, authorize(['ORGANIZER', 'ADMIN']), judgeController.removeAssignment);

export default router;
