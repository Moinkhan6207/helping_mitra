import { ServiceRepository } from './service.repository';
import { NotFoundError, ConflictError, ForbiddenError } from '../../core/errors/app.error';
import { SERVICE_MESSAGES } from './service.constants';
import { ServiceQueryOptions, AdminServiceQueryOptions, ServiceListItem } from './service.types';
import { CategoryStatus, ServiceStatus } from '@prisma/client';
import { logAudit } from '../../core/utils/audit.logger';
import { validateDynamicForm } from './service.form-validator';
import { validateServiceDocuments } from './service.upload-validator';
import { UploadMetadata } from '../firebase/firebase.types';
import { firebaseService } from '../firebase/firebase.service';
import { GovernmentFormPdfGenerator } from '../pdf/GovernmentFormPdfGenerator';

export class ServiceService {
  private serviceRepository = new ServiceRepository();
  private sidebarCache: any = null;
  private formConfigCache = new Map<string, any>();

  private clearCache() {
    this.sidebarCache = null;
    this.formConfigCache.clear();
  }

  // ==========================================
  // PUBLIC SERVICES
  // ==========================================

  /**
   * Get all active categories.
   */
  async getCategories() {
    return this.serviceRepository.findActiveCategories();
  }

  /**
   * Get active categories with their active services for sidebar navigation.
   * Enforces Rule 3 and Rule 4: only ACTIVE categories and ACTIVE services appear.
   */
  async getSidebarCategories() {
    if (this.sidebarCache) {
      return this.sidebarCache;
    }
    const categories = await this.serviceRepository.findSidebarCategories();
    this.sidebarCache = categories;
    return categories;
  }

  /**
   * Get paginated and filtered active services for the public catalogue.
   *
   * Each service record includes `resultType` and `resultLabel` which control
   * how admin order processing works in Phase 3:
   *
   * - `FILE_UPLOAD`  → Admin uploads a file (PDF/image). User downloads it.
   * - `STATUS_ONLY`  → Admin marks the order Approved/Rejected. No file needed.
   * - `TEXT_RESULT`  → Admin enters a text value (e.g. PAN Number). User sees text.
   *
   * @see ResultType enum in Prisma schema
   * @phase Phase 2 — Configuration only. Phase 3 will add order processing logic.
   */
  async getServices(options: ServiceQueryOptions) {
    const { page, limit, categorySlug } = options;

    if (categorySlug) {
      const category = await this.serviceRepository.findActiveCategoryBySlug(categorySlug);
      if (!category) {
        throw new NotFoundError(SERVICE_MESSAGES.CATEGORY_NOT_FOUND, 'CATEGORY_NOT_FOUND');
      }
    }

    const { services, total } = await this.serviceRepository.findActiveServices(options);
    const totalPages = Math.ceil(total / limit);

    const mappedServices: ServiceListItem[] = services.map((s) => ({
      ...s,
      mrp: Number(s.mrp),
    }));

    return {
      services: mappedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get a single active service's full details by its URL slug.
   *
   * Returns `resultType` and `resultLabel` used in Phase 3 for:
   * - Rendering the correct order completion UI (file upload / status / text input)
   * - Validating the admin's result submission against the expected format
   * - Displaying the result label to the user on order completion
   *
   * @param slug - The unique URL-safe slug of the service
   * @phase Phase 2 — Configuration only. Phase 3 will use this to drive order processing.
   */
  async getServiceDetails(slug: string) {
    const service = await this.serviceRepository.findActiveServiceBySlug(slug);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    return {
      ...service,
      mrp: Number(service.mrp),
    };
  }

  /**
   * Get dynamic form fields for the service order submission form.
   * Used alongside `resultType` in Phase 3 to build the order intake form.
   *
   * @param slug - The unique URL-safe slug of the service
   * @phase Phase 3 — Will power the order submission form fields.
   */
  async getServiceFields(slug: string) {
    const service = await this.serviceRepository.findActiveServiceBySlug(slug);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    return this.serviceRepository.findFormFieldsByServiceId(service.id);
  }

  /**
   * Get document upload requirements for the service order submission.
   * Used alongside `resultType` in Phase 3 to validate what files a user must upload.
   *
   * @param slug - The unique URL-safe slug of the service
   * @phase Phase 3 — Will power the order document upload checklist.
   */
  async getServiceDocuments(slug: string) {
    const service = await this.serviceRepository.findActiveServiceBySlug(slug);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    return this.serviceRepository.findDocumentRequirementsByServiceId(service.id);
  }

  /**
   * Get the full configuration required to render a service application page.
   * Enforces business rules: service exists, service status active, category status active.
   *
   * @param slug - The unique URL-safe slug of the service
   */
  async getApplicationConfig(slug: string) {
    const service = await this.serviceRepository.findActiveServiceBySlug(slug);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    const [fields, documents] = await Promise.all([
      this.serviceRepository.findFormFieldsByServiceId(service.id),
      this.serviceRepository.findDocumentRequirementsByServiceId(service.id),
    ]);

    return {
      id: service.id,
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription,
      description: service.description,
      mrp: Number(service.mrp),
      resultType: service.resultType,
      resultLabel: service.resultLabel,
      category: service.category,
      fields,
      documents,
    };
  }

  /**
   * Get dynamic form config for rendering the service application page.
   * Runs the Section Grouping Engine: groups flat DB fields by sectionName
   * into ordered sections. Frontend renders section cards dynamically —
   * NO hardcoded sections on the frontend.
   *
   * Section order is derived from the first appearance (lowest displayOrder)
   * of each unique sectionName across all fields.
   */
  async getFormConfig(slug: string) {
    if (this.formConfigCache.has(slug)) {
      return this.formConfigCache.get(slug);
    }

    const service = await this.serviceRepository.findActiveServiceBySlug(slug);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    const fields = await this.serviceRepository.findFormFieldsByServiceId(service.id);

    // ── Section Grouping Engine ────────────────────────────────────────────
    // Groups fields by sectionName preserving DB display order.
    // Fields with no sectionName fall into an implicit 'General' section.
    const sectionOrderMap = new Map<string, number>();
    const sectionFieldsMap = new Map<string, typeof fields>();
    let nextSectionOrder = 1;

    for (const field of fields) {
      const key = field.sectionName ?? 'General';
      if (!sectionOrderMap.has(key)) {
        sectionOrderMap.set(key, nextSectionOrder++);
        sectionFieldsMap.set(key, []);
      }
      sectionFieldsMap.get(key)!.push(field);
    }

    const sections = Array.from(sectionOrderMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([sectionName, sectionOrder]) => ({
        sectionName,
        sectionOrder,
        fields: sectionFieldsMap.get(sectionName)!,
      }));

    const documents = await this.serviceRepository.findDocumentRequirementsByServiceId(service.id);

    const config = {
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
        shortDescription: service.shortDescription,
        description: service.description,
        mrp: Number(service.mrp),
        resultType: service.resultType,
        resultLabel: service.resultLabel,
        category: service.category ? {
          id: service.category.id,
          name: service.category.name,
          slug: service.category.slug,
        } : null,
      },
      sections,
      fields,
      documents,
    };

    this.formConfigCache.set(slug, config);
    return config;
  }

  /**
   * Validates dynamic form submissions.
   * SELECT fields: validates submitted value is within the allowed options
   * defined in validationRules.options — rejects anything not in the list.
   *
   * Also validates any uploaded document metadata if provided in the payload.
   * payload.uploads: Record<string, UploadMetadata | null> — optional
   * payload.userId: string — required when uploads are present
   */
  async validateFormPayload(slug: string, payload: any) {
    const service = await this.serviceRepository.findActiveServiceBySlug(slug);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    // Separate field inputs from document metadata
    const { uploads, userId, ...fieldPayload } = payload;

    const fields = await this.serviceRepository.findFormFieldsByServiceId(service.id);
    const validationResult = validateDynamicForm(fields as any[], fieldPayload);

    if (!validationResult.success) {
      return {
        isValid: false,
        errors: validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }

    // Validate uploaded documents if provided
    if (uploads && userId) {
      const docValidation = await validateServiceDocuments(
        service.id,
        userId,
        uploads as Record<string, UploadMetadata | null>
      );

      if (!docValidation.isValid) {
        return {
          isValid: false,
          errors: docValidation.errors.map((e) => ({
            field: e.documentKey,
            message: e.message,
          })),
        };
      }
    }

    // Auto-generate official Government PAN PDF on successful validation
    let generatedPdf = null;
    if (uploads && userId && (slug === 'new-pan-apply' || slug === 'pan-correction')) {
      try {
        const pdfBuffer = await GovernmentFormPdfGenerator.generate(slug, payload);
        const tempPath = `/users/${userId}/temp/generated-form-${Date.now()}.pdf`;
        await firebaseService.uploadFile(tempPath, pdfBuffer, 'application/pdf');

        let previewUrl = '';
        if (firebaseService.mockMode) {
          previewUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
        } else {
          previewUrl = await firebaseService.getSignedUrl(tempPath, 15);
        }

        generatedPdf = {
          fileName: 'application.pdf',
          fileSize: pdfBuffer.length,
          storagePath: tempPath,
          fileType: 'application/pdf',
          previewUrl,
        };
      } catch (pdfErr) {
        console.error('PDF Generation failed during validation:', pdfErr);
      }
    }

    return {
      isValid: true,
      data: validationResult.data,
      generatedPdf,
    };
  }

  /**
   * Quick-search active services by name or short description.
   * Returns minimal data (name, slug) for autocomplete UIs.
   */
  async searchServices(query: string) {
    return this.serviceRepository.searchActiveServices(query);
  }

  // ==========================================
  // ADMIN SERVICES: CATEGORY
  // ==========================================

  async createCategory(data: any, adminId: string) {
    throw new ForbiddenError('Creating categories is disabled in Phase 2. Categories must be seeded.', 'CREATE_CATEGORY_DISABLED');
  }

  async getAdminCategories() {
    return this.serviceRepository.findAllCategoriesAdmin();
  }

  async updateCategory(id: string, data: any, adminId: string) {
    const category = await this.serviceRepository.findCategoryById(id);
    if (!category) {
      throw new NotFoundError(SERVICE_MESSAGES.CATEGORY_NOT_FOUND, 'CATEGORY_NOT_FOUND');
    }

    if (data.slug && data.slug !== category.slug) {
      const existing = await this.serviceRepository.findCategoryBySlug(data.slug);
      if (existing) {
        throw new ConflictError('Slug already exists', 'DUPLICATE_SLUG');
      }
    }

    const updated = await this.serviceRepository.updateCategory(id, data);
    this.clearCache();
    logAudit(adminId, 'Updated Category', 'ServiceCategory', { id, updates: data });
    return updated;
  }

  async deleteCategory(id: string, adminId: string) {
    throw new ForbiddenError('Deleting categories is disabled in Phase 2. Use status deactivation instead.', 'DELETE_CATEGORY_DISABLED');
  }

  // ==========================================
  // ADMIN SERVICES: SERVICE
  // ==========================================

  async createService(data: any, adminId: string) {
    throw new ForbiddenError('Creating services is disabled in Phase 2. Services must be seeded.', 'CREATE_SERVICE_DISABLED');
  }

  async getAdminServices(options: AdminServiceQueryOptions) {
    const { services, total } = await this.serviceRepository.findAllServicesAdmin(options);
    const totalPages = Math.ceil(total / options.limit);

    const mapped = services.map((s) => ({
      ...s,
      mrp: Number(s.mrp),
    }));

    return {
      services: mapped,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
      },
    };
  }

  async getAdminServiceById(id: string) {
    const service = await this.serviceRepository.findServiceById(id);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }
    return {
      ...service,
      mrp: Number(service.mrp),
    };
  }

  async updateService(id: string, data: any, adminId: string) {
    const service = await this.serviceRepository.findServiceById(id);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    if (data.slug && data.slug !== service.slug) {
      const existing = await this.serviceRepository.findServiceBySlug(data.slug);
      if (existing) {
        throw new ConflictError('Slug already exists', 'DUPLICATE_SLUG');
      }
    }

    if (data.categoryId && data.categoryId !== service.categoryId) {
      const category = await this.serviceRepository.findCategoryById(data.categoryId);
      if (!category) {
        throw new NotFoundError(SERVICE_MESSAGES.CATEGORY_NOT_FOUND, 'CATEGORY_NOT_FOUND');
      }
    }

    const currentMrp = Number(service.mrp);
    const newMrp = data.mrp !== undefined ? Number(data.mrp) : currentMrp;
    const hasMrpChanged = data.mrp !== undefined && currentMrp !== newMrp;

    const updated = await this.serviceRepository.updateServiceWithPriceHistory(
      id,
      data,
      hasMrpChanged,
      currentMrp,
      adminId
    );

    this.clearCache();

    logAudit(adminId, 'Updated Service', 'Service', { id, updates: data });
    if (hasMrpChanged) {
      logAudit(adminId, 'Updated Price', 'ServicePriceHistory', { serviceId: id, oldMrp: currentMrp, newMrp });
    }

    return {
      ...updated,
      mrp: Number(updated.mrp),
    };
  }

  async deleteService(id: string, adminId: string) {
    throw new ForbiddenError('Deleting services is disabled in Phase 2. Use status deactivation instead.', 'DELETE_SERVICE_DISABLED');
  }

  // ==========================================
  // ADMIN SERVICES: FIELDS
  // ==========================================

  async createField(serviceId: string, data: any, adminId: string) {
    throw new ForbiddenError('Creating questionnaire fields is disabled in Phase 2. Fields must be defined via seed data.', 'CREATE_FIELD_DISABLED');
  }

  async updateField(id: string, data: any, adminId: string) {
    throw new ForbiddenError('Modifying questionnaire fields is disabled in Phase 2. Fields must be defined via seed data.', 'UPDATE_FIELD_DISABLED');
  }

  async deleteField(id: string, adminId: string) {
    throw new ForbiddenError('Deleting questionnaire fields is disabled in Phase 2. Fields must be defined via seed data.', 'DELETE_FIELD_DISABLED');
  }

  // ==========================================
  // ADMIN SERVICES: DOCUMENTS
  // ==========================================

  async createDocument(serviceId: string, data: any, adminId: string) {
    throw new ForbiddenError('Creating document requirements is disabled in Phase 2. Document checklists must be configured via seed data.', 'CREATE_DOCUMENT_DISABLED');
  }

  async updateDocument(id: string, data: any, adminId: string) {
    throw new ForbiddenError('Modifying document requirements is disabled in Phase 2. Document checklists must be configured via seed data.', 'UPDATE_DOCUMENT_DISABLED');
  }

  async deleteDocument(id: string, adminId: string) {
    throw new ForbiddenError('Deleting document requirements is disabled in Phase 2. Document checklists must be configured via seed data.', 'DELETE_DOCUMENT_DISABLED');
  }

  // ==========================================
  // ADMIN SERVICES: PRICE HISTORY
  // ==========================================

  async getPriceHistory(serviceId: string) {
    const service = await this.serviceRepository.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, 'SERVICE_NOT_FOUND');
    }

    const history = await this.serviceRepository.findPriceHistoryByServiceId(serviceId);

    const formattedHistory = history.map((record) => ({
      oldMrp: Number(record.oldMrp),
      newMrp: Number(record.newMrp),
      changedBy: record.changedByAdmin.name,
      createdAt: record.createdAt,
    }));

    return {
      serviceName: service.name,
      history: formattedHistory,
    };
  }

  // ==========================================
  // PUBLIC STATS
  // ==========================================

  async getServiceStats() {
    return this.serviceRepository.getServiceStats();
  }
}

