import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/health', healthController.health);
router.get('/ready', healthController.ready);

export default router;
