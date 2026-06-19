import { prisma } from '../../config/database';
import { CategoryStatus, ServiceStatus, Prisma } from '@prisma/client';
import { ServiceQueryOptions, AdminServiceQueryOptions } from './service.types';

export class ServiceRepository {
  // ==========================================
  // PUBLIC QUERIES
  // ==========================================

  /**
   * Find all active service categories.
   */
  async findActiveCategories() {
    return prisma.serviceCategory.findMany({
      where: { status: CategoryStatus.ACTIVE },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
  }

  /**
   * Find all active categories with their active services — for sidebar navigation.
   * Only returns ACTIVE categories and only ACTIVE services within them.
   */
  async findSidebarCategories() {
    return prisma.serviceCategory.findMany({
      where: { status: CategoryStatus.ACTIVE },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        services: {
          where: { status: ServiceStatus.ACTIVE },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Find an active category by its slug to verify existence.
   */
  async findActiveCategoryBySlug(slug: string) {
    return prisma.serviceCategory.findFirst({
      where: {
        slug,
        status: CategoryStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  /**
   * Find and count active services based on queries.
   */
  async findActiveServices(options: ServiceQueryOptions) {
    const { page, limit, categorySlug, search } = options;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: ServiceStatus.ACTIVE,
      category: {
        status: CategoryStatus.ACTIVE,
      },
    };

    if (categorySlug) {
      whereClause.category = {
        slug: categorySlug,
        status: CategoryStatus.ACTIVE,
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        mrp: true,
        resultType: true,
        resultLabel: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            fields: true,
            documentRequirements: true,
          },
        },
      },
    });

    const total = await prisma.service.count({
      where: whereClause,
    });

    return { services, total };
  }

  /**
   * Find active service by its slug.
   */
  async findActiveServiceBySlug(slug: string) {
    return prisma.service.findFirst({
      where: {
        slug,
        status: ServiceStatus.ACTIVE,
        category: {
          status: CategoryStatus.ACTIVE,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        mrp: true,
        resultType: true,
        resultLabel: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Find form fields for a service ID, ordered by displayOrder.
   * Returns sectionName so the Section Grouping Engine can group fields
   * into logical sections without any hardcoding.
   */
  async findFormFieldsByServiceId(serviceId: string) {
    return prisma.serviceField.findMany({
      where: { serviceId },
      orderBy: { displayOrder: 'asc' },
      select: {
        label: true,
        fieldKey: true,
        fieldType: true,
        placeholder: true,
        isRequired: true,
        validationRules: true,
        sectionName: true,
      },
    });
  }

  /**
   * Find document requirements for a service ID.
   */
  async findDocumentRequirementsByServiceId(serviceId: string) {
    return prisma.serviceDocumentRequirement.findMany({
      where: { serviceId },
      orderBy: { displayOrder: 'asc' },
      select: {
        documentName: true,
        documentKey: true,
        isRequired: true,
        allowedFileTypes: true,
      },
    });
  }

  /**
   * Quick search active services.
   */
  async searchActiveServices(query: string) {
    return prisma.service.findMany({
      where: {
        status: ServiceStatus.ACTIVE,
        category: {
          status: CategoryStatus.ACTIVE,
        },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { shortDescription: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        name: true,
        slug: true,
      },
    });
  }

  // ==========================================
  // ADMIN QUERIES: CATEGORY
  // ==========================================

  async createCategory(data: Prisma.ServiceCategoryCreateInput) {
    return prisma.serviceCategory.create({
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        displayOrder: true,
      },
    });
  }

  async findCategoryById(id: string) {
    return prisma.serviceCategory.findUnique({
      where: { id },
    });
  }

  async findCategoryBySlug(slug: string) {
    return prisma.serviceCategory.findUnique({
      where: { slug },
    });
  }

  async findAllCategoriesAdmin() {
    return prisma.serviceCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        displayOrder: true,
      },
    });
  }

  async updateCategory(id: string, data: Prisma.ServiceCategoryUpdateInput) {
    return prisma.serviceCategory.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        displayOrder: true,
      },
    });
  }

  // ==========================================
  // ADMIN QUERIES: SERVICE
  // ==========================================

  async createService(data: Prisma.ServiceUncheckedCreateInput) {
    return prisma.service.create({
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        mrp: true,
        resultType: true,
        resultLabel: true,
        status: true,
        displayOrder: true,
        categoryId: true,
      },
    });
  }

  async findServiceById(id: string) {
    return prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        mrp: true,
        resultType: true,
        resultLabel: true,
        status: true,
        displayOrder: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        fields: {
          orderBy: { displayOrder: 'asc' },
        },
        documentRequirements: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findServiceBySlug(slug: string) {
    return prisma.service.findUnique({
      where: { slug },
    });
  }

  async findAllServicesAdmin(options: AdminServiceQueryOptions) {
    const { page, limit, categorySlug, search, status } = options;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (categorySlug) {
      whereClause.category = {
        slug: categorySlug,
      };
    }

    if (status) {
      whereClause.status = status as ServiceStatus;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        mrp: true,
        resultType: true,
        resultLabel: true,
        status: true,
        displayOrder: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const total = await prisma.service.count({
      where: whereClause,
    });

    return { services, total };
  }

  async updateServiceWithPriceHistory(
    id: string,
    updateData: Prisma.ServiceUpdateInput,
    hasMrpChanged: boolean,
    oldMrp: number,
    adminId: string
  ) {
    if (hasMrpChanged) {
      return prisma.$transaction(async (tx) => {
        const service = await tx.service.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            slug: true,
            shortDescription: true,
            description: true,
            mrp: true,
            resultType: true,
            resultLabel: true,
            status: true,
            displayOrder: true,
            categoryId: true,
          },
        });

        await tx.servicePriceHistory.create({
          data: {
            serviceId: id,
            oldMrp,
            newMrp: updateData.mrp as number,
            changedByAdminId: adminId,
          },
        });

        return service;
      });
    } else {
      return prisma.service.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          description: true,
          mrp: true,
          resultType: true,
          resultLabel: true,
          status: true,
          displayOrder: true,
          categoryId: true,
        },
      });
    }
  }

  // ==========================================
  // ADMIN QUERIES: FIELDS
  // ==========================================

  async createField(data: Prisma.ServiceFieldUncheckedCreateInput) {
    return prisma.serviceField.create({
      data,
      select: {
        id: true,
        serviceId: true,
        label: true,
        fieldKey: true,
        fieldType: true,
        placeholder: true,
        isRequired: true,
        validationRules: true,
        displayOrder: true,
      },
    });
  }

  async findFieldById(id: string) {
    return prisma.serviceField.findUnique({
      where: { id },
    });
  }

  async findFieldByServiceAndKey(serviceId: string, fieldKey: string) {
    return prisma.serviceField.findUnique({
      where: {
        serviceId_fieldKey: {
          serviceId,
          fieldKey,
        },
      },
    });
  }

  async updateField(id: string, data: Prisma.ServiceFieldUpdateInput) {
    return prisma.serviceField.update({
      where: { id },
      data,
      select: {
        id: true,
        serviceId: true,
        label: true,
        fieldKey: true,
        fieldType: true,
        placeholder: true,
        isRequired: true,
        validationRules: true,
        displayOrder: true,
      },
    });
  }

  async deleteField(id: string) {
    return prisma.serviceField.delete({
      where: { id },
    });
  }

  // ==========================================
  // ADMIN QUERIES: DOCUMENTS
  // ==========================================

  async createDocument(data: Prisma.ServiceDocumentRequirementUncheckedCreateInput) {
    return prisma.serviceDocumentRequirement.create({
      data,
      select: {
        id: true,
        serviceId: true,
        documentName: true,
        documentKey: true,
        isRequired: true,
        allowedFileTypes: true,
        displayOrder: true,
      },
    });
  }

  async findDocumentById(id: string) {
    return prisma.serviceDocumentRequirement.findUnique({
      where: { id },
    });
  }

  async findDocumentByServiceAndKey(serviceId: string, documentKey: string) {
    return prisma.serviceDocumentRequirement.findUnique({
      where: {
        serviceId_documentKey: {
          serviceId,
          documentKey,
        },
      },
    });
  }

  async updateDocument(id: string, data: Prisma.ServiceDocumentRequirementUpdateInput) {
    return prisma.serviceDocumentRequirement.update({
      where: { id },
      data,
      select: {
        id: true,
        serviceId: true,
        documentName: true,
        documentKey: true,
        isRequired: true,
        allowedFileTypes: true,
        displayOrder: true,
      },
    });
  }

  async deleteDocument(id: string) {
    return prisma.serviceDocumentRequirement.delete({
      where: { id },
    });
  }

  // ==========================================
  // ADMIN QUERIES: PRICE HISTORY
  // ==========================================

  async findPriceHistoryByServiceId(serviceId: string) {
    return prisma.servicePriceHistory.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' },
      select: {
        oldMrp: true,
        newMrp: true,
        createdAt: true,
        changedByAdmin: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  // ==========================================
  // PUBLIC STATS
  // ==========================================

  /**
   * Returns aggregate counts for public stats endpoint.
   */
  async getServiceStats() {
    const [totalCategories, totalServices] = await Promise.all([
      prisma.serviceCategory.count({ where: { status: CategoryStatus.ACTIVE } }),
      prisma.service.count({ where: { status: ServiceStatus.ACTIVE } }),
    ]);
    return { totalCategories, totalServices };
  }
}

