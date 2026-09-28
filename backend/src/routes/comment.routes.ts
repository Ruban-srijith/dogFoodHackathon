import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimiter';
import { createCommentSchema } from '../schemas';

const router = Router();

const commentLimiter = rateLimiter({ maxRequests: 30, windowSeconds: 60 });

router.get('/submission/:submissionId', optionalAuthenticate, commentController.listComments);
router.post(
  '/submission/:submissionId',
  authenticate,
  commentLimiter,
  validate(createCommentSchema),
  commentController.createComment
);
router.delete('/:id', authenticate, commentController.deleteComment);

export default router;
