import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';

const router = Router();

/**
 * Register module routes here.
 * As new modules like Wallet, Payments, Orders, etc., are developed,
 * they will mount their respective routers under this entrypoint.
 */
router.use('/health', healthRoutes);

export default router;
