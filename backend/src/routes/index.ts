import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';
import authRoutes from '../modules/auth/auth.routes';
import testRoutes from './test.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import { publicRouter, adminRouter } from '../modules/services/service.routes';

const router = Router();

/**
 * Register module routes here.
 * As new modules like Wallet, Payments, Orders, etc., are developed,
 * they will mount their respective routers under this entrypoint.
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/services', publicRouter);
router.use('/admin', adminRouter);

export default router;
