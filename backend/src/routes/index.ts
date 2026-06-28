import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';
import authRoutes from '../modules/auth/auth.routes';
import testRoutes from './test.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import { publicRouter, adminRouter } from '../modules/services/service.routes';
import walletRoutes from '../modules/wallet/wallet.routes';
import orderRoutes from '../modules/orders/order.routes';
import adminOrderRoutes from '../modules/orders/admin-order.routes';
import uploadRoutes from '../modules/uploads/upload.routes';

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
router.use('/admin/orders', adminOrderRoutes); // Specific route registers before general admin routes
router.use('/admin', adminRouter);
router.use('/wallet', walletRoutes);
router.use('/orders', orderRoutes);
router.use('/uploads', uploadRoutes);

export default router;
