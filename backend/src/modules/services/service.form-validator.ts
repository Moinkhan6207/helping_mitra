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
        fieldSchema = z.string().min(1, { message: `${field.label} is required` });
      }

      if (!field.isRequired) {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }
    } else {
      // String-based fields (TEXT, EMAIL, MOBILE, NUMBER, DATE, etc.)
      let stringSchema = z.string();

      // Apply isRequired constraint first if required
      if (field.isRequired) {
        stringSchema = stringSchema.min(1, { message: `${field.label} is required` });
      }

      // Apply type-specific format validations
      if (field.fieldType === ServiceFieldType.EMAIL) {
        stringSchema = stringSchema.email({ message: 'Invalid email address' });
      } else if (field.fieldType === ServiceFieldType.MOBILE) {
        stringSchema = stringSchema.regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' });
      }

      // Apply custom rules (minLength, maxLength, pattern) on the stringSchema
      if (rules.minLength && typeof stringSchema.min === 'function') {
        stringSchema = stringSchema.min(rules.minLength, {
          message: `${field.label} must be at least ${rules.minLength} characters`,
        });
      }
      if (rules.maxLength && typeof stringSchema.max === 'function') {
        stringSchema = stringSchema.max(rules.maxLength, {
          message: `${field.label} cannot exceed ${rules.maxLength} characters`,
        });
      }
      if (rules.pattern) {
        stringSchema = stringSchema.regex(new RegExp(rules.pattern), {
          message: `Invalid format for ${field.label}`,
        });
      }

      // Apply refinements for NUMBER and DATE types
      if (field.fieldType === ServiceFieldType.NUMBER) {
        fieldSchema = stringSchema.refine((val) => {
          if (!val && !field.isRequired) return true;
          return !isNaN(Number(val));
        }, {
          message: 'Must be a valid number',
        });
      } else if (field.fieldType === ServiceFieldType.DATE) {
        fieldSchema = stringSchema.refine((val) => {
          if (!val && !field.isRequired) return true;
          return !isNaN(Date.parse(val));
        }, {
          message: 'Must be a valid date',
        });
      } else {
        fieldSchema = stringSchema;
      }

      // Handle optional/empty values for the final schema
      if (!field.isRequired) {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }
    }

    schemaFields[field.fieldKey] = fieldSchema;
  }

  const dynamicSchema = z.object(schemaFields);
  return dynamicSchema.safeParse(payload);
}
