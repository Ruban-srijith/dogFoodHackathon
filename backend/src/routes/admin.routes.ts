import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/audit', authenticate, authorize(['ADMIN']), adminController.getAuditLogs);
router.get('/stats', authenticate, authorize(['ORGANIZER', 'ADMIN']), adminController.getPlatformStats);

export default router;
