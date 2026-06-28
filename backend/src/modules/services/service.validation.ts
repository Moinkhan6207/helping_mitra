import { z } from 'zod';
import { CategoryStatus, ServiceStatus, ResultType, ServiceFieldType } from '@prisma/client';

// Public/Shared Query Validation
export const serviceQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: 'Page must be a positive integer greater than or equal to 1',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: 'Limit must be an integer between 1 and 100',
    }),
  category: z.string().optional(),
  search: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: 'Search term must be at least 2 characters long',
    }),
});

export const searchQuerySchema = z.object({
  q: z
    .string({
      required_error: 'Query parameter q is required',
    })
    .min(2, {
      message: 'Search term must be at least 2 characters long',
    }),
});

export const slugParamSchema = z.object({
  slug: z
    .string({
      required_error: 'Slug parameter is required',
    })
    .trim()
    .min(1, {
      message: 'Slug cannot be empty',
    }),
});

// UUID Parameters Validation
export const idParamSchema = z.object({
  id: z.string({ required_error: 'ID is required' }).uuid({ message: 'Invalid ID format. Must be UUID' }),
});

export const serviceIdParamSchema = z.object({
  serviceId: z.string({ required_error: 'Service ID is required' }).uuid({ message: 'Invalid Service ID format. Must be UUID' }),
});

// Admin Query Validation
export const adminServiceQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: 'Page must be a positive integer greater than or equal to 1',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 1000, {
      message: 'Limit must be an integer between 1 and 1000',
    }),
  category: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  search: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: 'Search term must be at least 2 characters long',
    }),
  status: z.preprocess((val) => (val === '' ? undefined : val), z.nativeEnum(ServiceStatus).optional()),
});

// Category Validation
export const createCategorySchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name cannot be empty'),
  slug: z
    .string({ required_error: 'Slug is required' })
    .trim()
    .min(1, 'Slug cannot be empty')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  description: z.string().trim().optional().nullable(),
  displayOrder: z.number({ required_error: 'Display order is required' }).int().min(0, 'Display order must be a non-negative integer'),
  status: z.nativeEnum(CategoryStatus).default(CategoryStatus.ACTIVE),
});

export const updateCategorySchema = createCategorySchema.partial();

// Service Validation
export const createServiceSchema = z.object({
  categoryId: z.string({ required_error: 'Category ID is required' }).uuid('Category ID must be a valid UUID'),
  name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name cannot be empty'),
  slug: z
    .string({ required_error: 'Slug is required' })
    .trim()
    .min(1, 'Slug cannot be empty')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  shortDescription: z.string({ required_error: 'Short description is required' }).trim().min(1, 'Short description cannot be empty'),
  description: z.string({ required_error: 'Description is required' }).trim().min(1, 'Description cannot be empty'),
  mrp: z.number({ required_error: 'MRP is required' }).positive('MRP must be a positive number greater than zero'),
  resultType: z.nativeEnum(ResultType, { required_error: 'Result type is required' }),
  resultLabel: z.string({ required_error: 'Result label is required' }).trim().min(1, 'Result label cannot be empty'),
  displayOrder: z.number({ required_error: 'Display order is required' }).int().min(0, 'Display order must be a non-negative integer'),
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.ACTIVE),
});

export const updateServiceSchema = createServiceSchema.partial();

/**
 * FR-2.8: Dedicated MRP update validation schema.
 * - MRP is required (not optional)
 * - MRP must be a positive number (> 0)
 * - MRP cannot be zero or negative
 * Used for the dedicated PATCH /admin/services/:id/mrp endpoint.
 */
export const updateMrpSchema = z.object({
  mrp: z
    .number({ required_error: 'MRP is required', invalid_type_error: 'MRP must be a number' })
    .positive('MRP must be a positive value greater than zero')
    .refine((val) => val > 0, { message: 'MRP cannot be zero or negative' }),
});

/**
 * FR-2.7: Service status toggle validation schema.
 * Only ACTIVE/INACTIVE are valid status values.
 */
export const updateStatusSchema = z.object({
  status: z.nativeEnum(ServiceStatus, { required_error: 'Status is required', invalid_type_error: 'Status must be ACTIVE or INACTIVE' }),
});

// Dynamic Form Field Validation
export const createFieldSchema = z.object({
  label: z.string({ required_error: 'Field label is required' }).trim().min(1, 'Field label cannot be empty'),
  fieldKey: z.string({ required_error: 'Field key is required' }).trim().min(1, 'Field key cannot be empty'),
  fieldType: z.nativeEnum(ServiceFieldType, { required_error: 'Field type is required' }),
  placeholder: z.string().trim().optional().nullable(),
  isRequired: z.boolean().default(true),
  validationRules: z.any().optional().nullable(),
  displayOrder: z.number({ required_error: 'Display order is required' }).int().min(0, 'Display order must be a non-negative integer'),
});

export const updateFieldSchema = createFieldSchema.partial();

// Document Requirement Validation
export const createDocumentSchema = z.object({
  documentName: z.string({ required_error: 'Document name is required' }).trim().min(1, 'Document name cannot be empty'),
  documentKey: z.string({ required_error: 'Document key is required' }).trim().min(1, 'Document key cannot be empty'),
  isRequired: z.boolean().default(true),
  allowedFileTypes: z.array(z.string()).default(['PDF', 'JPG', 'JPEG', 'PNG']),
  displayOrder: z.number({ required_error: 'Display order is required' }).int().min(0, 'Display order must be a non-negative integer'),
});

export const updateDocumentSchema = createDocumentSchema.partial();
