import { Request, Response } from 'express';
import { ServiceService } from './service.service';
import { sendSuccess } from '../../core/responses/api.response';
import { catchAsync } from '../../core/errors/catchAsync';
import { SERVICE_MESSAGES } from './service.constants';

export class ServiceController {
  private serviceService = new ServiceService();

  // ==========================================
  // PUBLIC CONTROLLER ACTIONS
  // ==========================================

  /**
   * Fetch all active categories.
   */
  getCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const categories = await this.serviceService.getCategories();
    sendSuccess(res, SERVICE_MESSAGES.CATEGORIES_FETCHED, categories, 200);
  });

  /**
   * Fetch sidebar categories — active categories with their active services.
   * Protected: requires authenticated ACTIVE USER.
   */
  getSidebarCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const categories = await this.serviceService.getSidebarCategories();
    sendSuccess(res, 'Sidebar categories fetched successfully', categories, 200);
  });

  /**
   * Fetch paginated and filtered services.
   */
  getServices = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, category, search } = req.query as any;
    const result = await this.serviceService.getServices({
      page,
      limit,
      categorySlug: category,
      search,
    });
    sendSuccess(res, SERVICE_MESSAGES.SERVICES_FETCHED, result, 200);
  });

  /**
   * Fetch service details by slug.
   */
  getServiceDetails = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const service = await this.serviceService.getServiceDetails(slug);
    sendSuccess(res, SERVICE_MESSAGES.SERVICE_FETCHED, service, 200);
  });

  /**
   * Fetch form fields for a service.
   */
  getServiceFields = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const fields = await this.serviceService.getServiceFields(slug);
    sendSuccess(res, SERVICE_MESSAGES.FIELDS_FETCHED, fields, 200);
  });

  /**
   * Fetch required documents for a service.
   */
  getServiceDocuments = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const documents = await this.serviceService.getServiceDocuments(slug);
    sendSuccess(res, SERVICE_MESSAGES.DOCUMENTS_FETCHED, documents, 200);
  });

  /**
   * Fetch service application configuration (authenticated USER only).
   */
  getApplicationConfig = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const config = await this.serviceService.getApplicationConfig(slug);
    sendSuccess(res, 'Service application configuration retrieved successfully', config, 200);
  });

  /**
   * Fetch service form configuration (authenticated USER only).
   */
  getFormConfig = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const config = await this.serviceService.getFormConfig(slug);
    sendSuccess(res, 'Service form configuration retrieved successfully', config, 200);
  });

  /**
   * Validate service form submission payload (authenticated USER only).
   */
  validateFormPayload = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    const result = await this.serviceService.validateFormPayload(slug, req.body);
    if (!result.isValid) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors,
      });
      return;
    }
    sendSuccess(res, 'Form payload validated successfully', result.data, 200);
  });

  /**
   * Quick search services.
   */
  searchServices = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query as any;
    const results = await this.serviceService.searchServices(q);
    sendSuccess(res, SERVICE_MESSAGES.SEARCH_RESULTS_FETCHED, results, 200);
  });

  // ==========================================
  // ADMIN CONTROLLER ACTIONS: CATEGORY
  // ==========================================

  createCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const adminId = (req as any).user.id;
    const category = await this.serviceService.createCategory(req.body, adminId);
    sendSuccess(res, 'Category created successfully', category, 201);
  });

  getAdminCategories = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const categories = await this.serviceService.getAdminCategories();
    sendSuccess(res, 'Categories retrieved successfully', categories, 200);
  });

  updateCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const category = await this.serviceService.updateCategory(id, req.body, adminId);
    sendSuccess(res, 'Category updated successfully', category, 200);
  });

  deleteCategory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const category = await this.serviceService.deleteCategory(id, adminId);
    sendSuccess(res, 'Category disabled successfully', category, 200);
  });

  // ==========================================
  // ADMIN CONTROLLER ACTIONS: SERVICE
  // ==========================================

  createService = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const adminId = (req as any).user.id;
    const service = await this.serviceService.createService(req.body, adminId);
    sendSuccess(res, 'Service created successfully', service, 201);
  });

  getAdminServices = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, category, search, status } = req.query as any;
    const result = await this.serviceService.getAdminServices({
      page,
      limit,
      categorySlug: category,
      search,
      status,
    });
    sendSuccess(res, 'Services retrieved successfully', result, 200);
  });

  getAdminServiceById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const service = await this.serviceService.getAdminServiceById(id);
    sendSuccess(res, 'Service details retrieved successfully', service, 200);
  });

  updateService = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const service = await this.serviceService.updateService(id, req.body, adminId);
    sendSuccess(res, 'Service updated successfully', service, 200);
  });

  deleteService = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const service = await this.serviceService.deleteService(id, adminId);
    sendSuccess(res, 'Service disabled successfully', service, 200);
  });

  /**
   * FR-2.8: Dedicated MRP update action.
   * Validates MRP strictly (positive, non-zero) and records price history in a transaction.
   * Separate from the general updateService to enforce FR-2.8 constraints server-side.
   */
  updateMrp = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const service = await this.serviceService.updateService(id, req.body, adminId);
    sendSuccess(res, 'Service MRP updated successfully', service, 200);
  });

  // ==========================================
  // ADMIN CONTROLLER ACTIONS: FIELDS
  // ==========================================

  createField = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { serviceId } = req.params;
    const adminId = (req as any).user.id;
    const field = await this.serviceService.createField(serviceId, req.body, adminId);
    sendSuccess(res, 'Service field created successfully', field, 201);
  });

  updateField = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const field = await this.serviceService.updateField(id, req.body, adminId);
    sendSuccess(res, 'Service field updated successfully', field, 200);
  });

  deleteField = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    await this.serviceService.deleteField(id, adminId);
    sendSuccess(res, 'Service field deleted successfully', {}, 200);
  });

  // ==========================================
  // ADMIN CONTROLLER ACTIONS: DOCUMENTS
  // ==========================================

  createDocument = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { serviceId } = req.params;
    const adminId = (req as any).user.id;
    const document = await this.serviceService.createDocument(serviceId, req.body, adminId);
    sendSuccess(res, 'Required document created successfully', document, 201);
  });

  updateDocument = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    const document = await this.serviceService.updateDocument(id, req.body, adminId);
    sendSuccess(res, 'Required document updated successfully', document, 200);
  });

  deleteDocument = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user.id;
    await this.serviceService.deleteDocument(id, adminId);
    sendSuccess(res, 'Required document deleted successfully', {}, 200);
  });

  // ==========================================
  // ADMIN CONTROLLER ACTIONS: PRICE HISTORY
  // ==========================================

  getPriceHistory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { serviceId } = req.params;
    const result = await this.serviceService.getPriceHistory(serviceId);
    sendSuccess(res, 'Service price history retrieved successfully', result, 200);
  });

  // ==========================================
  // PUBLIC STATS
  // ==========================================

  getServiceStats = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.serviceService.getServiceStats();
    sendSuccess(res, 'Service statistics retrieved successfully', stats, 200);
  });
}

