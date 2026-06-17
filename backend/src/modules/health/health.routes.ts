import { Router } from 'express';
import { healthController } from './health.controller';
import { catchAsync } from '../../core/errors/catchAsync';

const router = Router();

router.get('/', catchAsync(healthController.getHealth));
router.get('/db', catchAsync(healthController.getDatabaseHealth));

export default router;
