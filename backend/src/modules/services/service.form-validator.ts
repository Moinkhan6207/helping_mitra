import { z } from 'zod';
import { ServiceField, ServiceFieldType } from '@prisma/client';

/**
 * Validates dynamic form payload against the service fields and validation rules.
 * Generates a dynamic Zod schema based on each field's requirements and type.
 *
 * SELECT fields: value must be one of the allowed options stored in
 * validationRules.options — prevents frontend manipulation of dropdown values.
 */
export function validateDynamicForm(fields: ServiceField[], payload: any) {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    // Parse validationRules once
    const rules: any = field.validationRules
      ? typeof field.validationRules === 'string'
        ? JSON.parse(field.validationRules)
        : (field.validationRules as any)
      : {};

    let fieldSchema: z.ZodTypeAny;

    // ── Type-specific baseline validation ────────────────────────────────────
    if (field.fieldType === ServiceFieldType.SELECT) {
      // SELECT: enforce allowed values from options list (backend enforced)
      const allowedValues: string[] = Array.isArray(rules.options)
        ? rules.options.map((opt: any) =>
            typeof opt === 'string' ? opt : opt.value ?? opt.label ?? ''
          )
        : [];

      if (allowedValues.length > 0) {
        fieldSchema = z.enum(allowedValues as [string, ...string[]], {
          errorMap: () => ({ message: `Invalid selection for ${field.label}. Must be one of the allowed options.` }),
        });
      } else {
        // No options configured → accept any non-empty string
        fieldSchema = z.string().min(1, { message: `${field.label} is required` });
      }
    } else if (field.fieldType === ServiceFieldType.EMAIL) {
      fieldSchema = z.string().email({ message: 'Invalid email address' });
    } else if (field.fieldType === ServiceFieldType.MOBILE) {
      fieldSchema = z.string().regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' });
    } else if (field.fieldType === ServiceFieldType.NUMBER) {
      fieldSchema = z.string().refine((val) => !isNaN(Number(val)), {
        message: 'Must be a valid number',
      });
    } else if (field.fieldType === ServiceFieldType.DATE) {
      fieldSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Must be a valid date',
      });
    } else {
      fieldSchema = z.string();
    }

    // ── Required vs Optional ─────────────────────────────────────────────────
    // Skip re-applying min(1) for SELECT as z.enum already enforces valid values
    if (field.fieldType !== ServiceFieldType.SELECT) {
      if (field.isRequired) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, { message: `${field.label} is required` });
      } else {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }
    } else if (!field.isRequired) {
      fieldSchema = fieldSchema.optional().or(z.literal(''));
    }

    // ── Custom rules (minLength, maxLength, pattern) ─────────────────────────
    // Not applicable for SELECT fields
    if (field.fieldType !== ServiceFieldType.SELECT) {
      if (rules.minLength && typeof (fieldSchema as any).min === 'function') {
        fieldSchema = (fieldSchema as any).min(rules.minLength, {
          message: `${field.label} must be at least ${rules.minLength} characters`,
        });
      }
      if (rules.maxLength && typeof (fieldSchema as any).max === 'function') {
        fieldSchema = (fieldSchema as any).max(rules.maxLength, {
          message: `${field.label} cannot exceed ${rules.maxLength} characters`,
        });
      }
      if (rules.pattern) {
        fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(rules.pattern), {
          message: `Invalid format for ${field.label}`,
        });
      }
    }

    schemaFields[field.fieldKey] = fieldSchema;
  }

  const dynamicSchema = z.object(schemaFields);
  return dynamicSchema.safeParse(payload);
}
