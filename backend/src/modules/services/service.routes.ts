import { Router, Request, Response, NextFunction } from 'express';
import { ServiceController } from './service.controller';
import {
  serviceQuerySchema,
  searchQuerySchema,
  slugParamSchema,
  idParamSchema,
  serviceIdParamSchema,
  adminServiceQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  createServiceSchema,
  updateServiceSchema,
  updateMrpSchema,
  updateStatusSchema,
  createFieldSchema,
  updateFieldSchema,
  createDocumentSchema,
  updateDocumentSchema,
} from './service.validation';
import { ZodTypeAny } from 'zod';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { ForbiddenError, UnauthorizedError } from '../../core/errors/app.error';

export const publicRouter = Router();
export const adminRouter = Router();
const controller = new ServiceController();

// ==========================================
// REQUEST VALIDATION MIDDLEWARES
// ==========================================

const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateQuery = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateParams = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// ==========================================
// CUSTOM AUTHORIZATION GATE
// ==========================================

const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Access denied', 'UNAUTHORIZED'));
  }
  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Access denied', 'ACCESS_DENIED'));
  }
  next();
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

publicRouter.get('/categories', controller.getCategories);
publicRouter.get('/search', validateQuery(searchQuerySchema), controller.searchServices);
publicRouter.get('/stats', controller.getServiceStats);
publicRouter.get('/', validateQuery(serviceQuerySchema), controller.getServices);
publicRouter.get('/:slug', validateParams(slugParamSchema), controller.getServiceDetails);
publicRouter.get('/:slug/fields', validateParams(slugParamSchema), controller.getServiceFields);
publicRouter.get('/:slug/documents', validateParams(slugParamSchema), controller.getServiceDocuments);


// ==========================================
// ADMIN ROUTES (Admin Only)
// ==========================================

adminRouter.use(authMiddleware);
adminRouter.use(adminOnlyMiddleware);

// Category CRUD
adminRouter.post('/service-categories', validateBody(createCategorySchema), controller.createCategory);
adminRouter.get('/service-categories', controller.getAdminCategories);
adminRouter.patch('/service-categories/:id', validateParams(idParamSchema), validateBody(updateCategorySchema), controller.updateCategory);
adminRouter.delete('/service-categories/:id', validateParams(idParamSchema), controller.deleteCategory);

// Service CRUD
adminRouter.post('/services', validateBody(createServiceSchema), controller.createService);
adminRouter.get('/services', validateQuery(adminServiceQuerySchema), controller.getAdminServices);
adminRouter.get('/services/:id', validateParams(idParamSchema), controller.getAdminServiceById);
adminRouter.patch('/services/:id', validateParams(idParamSchema), validateBody(updateServiceSchema), controller.updateService);
adminRouter.delete('/services/:id', validateParams(idParamSchema), controller.deleteService);

// FR-2.8: Dedicated MRP update — enforces strict positive/non-zero MRP validation server-side
adminRouter.patch('/services/:id/mrp', validateParams(idParamSchema), validateBody(updateMrpSchema), controller.updateMrp);

// FR-2.7: Dedicated status toggle — enforces only ACTIVE/INACTIVE
adminRouter.patch('/services/:id/status', validateParams(idParamSchema), validateBody(updateStatusSchema), controller.updateService);

// Service Field CRUD
adminRouter.post('/services/:serviceId/fields', validateParams(serviceIdParamSchema), validateBody(createFieldSchema), controller.createField);
adminRouter.patch('/fields/:id', validateParams(idParamSchema), validateBody(updateFieldSchema), controller.updateField);
adminRouter.delete('/fields/:id', validateParams(idParamSchema), controller.deleteField);

// Required Document CRUD
adminRouter.post('/services/:serviceId/documents', validateParams(serviceIdParamSchema), validateBody(createDocumentSchema), controller.createDocument);
adminRouter.patch('/documents/:id', validateParams(idParamSchema), validateBody(updateDocumentSchema), controller.updateDocument);
adminRouter.delete('/documents/:id', validateParams(idParamSchema), controller.deleteDocument);

// Price History Logs
adminRouter.get('/services/:serviceId/price-history', validateParams(serviceIdParamSchema), controller.getPriceHistory);
