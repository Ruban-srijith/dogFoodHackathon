import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, authorize(['ADMIN', 'ORGANIZER']), userController.listUsers);
router.get('/:id', authenticate, userController.getUserById);
router.patch('/:id/role', authenticate, authorize(['ADMIN']), userController.updateUserRole);

export default router;
