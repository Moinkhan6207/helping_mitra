'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, CheckCircle2, ServerCrash, RefreshCw, Send, Terminal, HelpCircle } from 'lucide-react';
import { useServiceFormConfig } from '../hooks/useServiceFormConfig';
import { serviceApi } from '../api/service.api';
import DynamicSectionRenderer from './DynamicSectionRenderer';

interface DynamicServiceFormProps {
  serviceSlug: string;
  uploads?: Record<string, any>;
  userId?: string;
  onValidated?: (payload: any | null) => void;
  onValidating?: (isValidating: boolean) => void;
}

export default function DynamicServiceForm({
  serviceSlug,
  uploads,
  userId,
  onValidated,
  onValidating,
}: DynamicServiceFormProps) {
  const { formConfig, isLoading, isError, error } = useServiceFormConfig(serviceSlug);
  const [isValidatedOnServer, setIsValidatedOnServer] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);
  const [tempPayloadState, setTempPayloadState] = useState<any | null>(null);

  // Extract all fields for validation schema building and payload construction
  const fields = useMemo(() => {
    return formConfig?.fields || [];
  }, [formConfig]);

  // 1. Build Zod Schema Dynamically
  const dynamicZodSchema = useMemo(() => {
    if (fields.length === 0) {
      return z.object({});
    }

    const schemaFields: Record<string, z.ZodTypeAny> = {};

    for (const field of fields) {
      let fieldSchema: z.ZodTypeAny = z.string();

      const rules = field.validationRules
        ? typeof field.validationRules === 'string'
          ? JSON.parse(field.validationRules)
          : field.validationRules
        : {};

      // Basic Type Constraints
      if (field.fieldType === 'EMAIL') {
        fieldSchema = z.string().email({ message: 'Please enter a valid email address' });
      } else if (field.fieldType === 'MOBILE') {
        fieldSchema = z.string().regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' });
      } else if (field.fieldType === 'NUMBER') {
        fieldSchema = z.string().refine((val) => val === '' || !isNaN(Number(val)), {
          message: 'Must be a valid number',
        });
      } else if (field.fieldType === 'DATE') {
        fieldSchema = z.string().refine((val) => val === '' || !isNaN(Date.parse(val)), {
          message: 'Must be a valid date',
        });
      } else if (field.fieldType === 'SELECT') {
        const allowedValues: string[] = Array.isArray(rules.options)
          ? rules.options.map((opt: any) =>
              typeof opt === 'string' ? opt : opt.value ?? opt.label ?? ''
            )
          : [];

        if (allowedValues.length > 0) {
          fieldSchema = z.enum(allowedValues as [string, ...string[]], {
            message: `Please select a valid option for ${field.label}`,
          });
        } else {
          fieldSchema = z.string();
        }
      }

      // Check IsRequired
      if (field.isRequired) {
        if (field.fieldType !== 'SELECT') {
          fieldSchema = (fieldSchema as z.ZodString).min(1, { message: `${field.label} is required` });
        }
        // For SELECT, z.enum already requires a matching non-empty option value (since "" is disabled/omitted).
      } else {
        fieldSchema = fieldSchema.optional().or(z.literal(''));
      }

      // Custom Validation Rules from Database (minLength, maxLength, pattern)
      if (field.fieldType !== 'SELECT') {
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

    return z.object(schemaFields);
  }, [fields]);

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm({
    resolver: zodResolver(dynamicZodSchema),
    mode: 'onTouched',
  });

  // 3. Form submission payload builder
  const onSubmit = async (data: any) => {
    setIsSubmittingToServer(true);
    if (onValidating) onValidating(true);
    setServerError(null);
    setIsValidatedOnServer(false);
    if (onValidated) onValidated(null);

    try {
      // Dynamic payload builder: compiles form inputs to target JSON structure
      const payload: Record<string, any> = {};

      // Clean and build final submission payload
      if (fields.length > 0) {
        fields.forEach((field) => {
          const val = data[field.fieldKey];
          // Cast values based on fieldType
          if (field.fieldType === 'NUMBER' && val !== '') {
            payload[field.fieldKey] = Number(val);
          } else {
            payload[field.fieldKey] = val;
          }
        });
      }

      // Merge uploads and userId if provided
      const fullPayload = {
        ...payload,
        ...(uploads ? { uploads } : {}),
        ...(userId ? { userId } : {}),
      };

      // Trigger Backend Dynamic Validation Layer (POST /api/services/:slug/validate)
      const response = await serviceApi.validateForm(serviceSlug, fullPayload);

      // Store temporarily in component state (Phase 3 requirement)
      setTempPayloadState(fullPayload);
      setIsValidatedOnServer(true);
      if (onValidated) {
        onValidated(fullPayload);
      }
    } catch (err: any) {
      // Handle server-side validation error mapping (Backend validation works / Invalid data blocked)
      const apiErrors = err?.errors || err?.response?.data?.errors;
      const errMsg = err?.message || err?.response?.data?.message;
      if (apiErrors && Array.isArray(apiErrors)) {
        const unmappedErrors: string[] = [];
        apiErrors.forEach((serverErr: any) => {
          // Check if this is a registered form field
          const isFormField = fields.some((f) => f.fieldKey === serverErr.field);
          if (isFormField) {
            setError(serverErr.field, {
              type: 'server',
              message: serverErr.message,
            });
          } else {
            // Document error or other unmapped error
            unmappedErrors.push(serverErr.message);
          }
        });

        if (unmappedErrors.length > 0) {
          setServerError(`Validation failed: ${unmappedErrors.join(', ')}`);
        } else {
          setServerError('Server-side validation failed. Please check the highlighted errors.');
        }
      } else {
        setServerError(errMsg || 'Server validation failed. Please try again.');
      }
    } finally {
      setIsSubmittingToServer(false);
      if (onValidating) onValidating(false);
    }
  };

  const handleReset = () => {
    reset();
    setIsValidatedOnServer(false);
    setServerError(null);
    setTempPayloadState(null);
    if (onValidated) {
      onValidated(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-500 tracking-wide animate-pulse">Loading form layout...</p>
      </div>
    );
  }

  // Error state
  if (isError || !formConfig) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[300px] max-w-lg mx-auto">
        <ServerCrash size={40} className="text-red-500 mb-4" />
        <h3 className="text-base font-black text-slate-900 tracking-tight">Unable to load service configuration.</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
          {error?.message || 'Failed to load form configuration from backend. Please refresh the page.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (fields.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
        <AlertCircle size={40} className="text-amber-500 mb-4" />
        <h3 className="text-base font-black text-slate-900 tracking-tight">Service configuration unavailable.</h3>
        <p className="text-xs text-slate-500 max-w-sm font-medium leading-relaxed mt-2">
          Please contact administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Submission Confirmation Alerts */}
      {isValidatedOnServer && tempPayloadState && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 md:p-6 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-100 rounded-xl text-emerald-600 shrink-0 mt-0.5">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Form Validated & Prepared</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-normal">
                Frontend & Backend validators processed successfully. The structured payload has been stored in local component state.
              </p>
            </div>
          </div>

          {/* Structured Payload Viewer (Inspecting payload builder output) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Terminal size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-wider">Payload Inspector</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 uppercase">
                Success
              </span>
            </div>
            <pre className="text-[11px] text-blue-300 font-mono overflow-x-auto select-all max-h-[140px] leading-relaxed">
              {JSON.stringify(tempPayloadState, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs bg-white hover:bg-slate-50 active:scale-95 transition-all uppercase tracking-wider"
            >
              Reset Form
            </button>
          </div>
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-150 rounded-2xl p-4 flex items-start gap-3 text-red-700 animate-in fade-in duration-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-normal">{serverError}</p>
        </div>
      )}

      {/* Responsive Form Core Layout */}
      <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <DynamicSectionRenderer
          sections={formConfig.sections}
          register={register}
          errors={errors}
        />
      </form>
    </div>
  );
}
