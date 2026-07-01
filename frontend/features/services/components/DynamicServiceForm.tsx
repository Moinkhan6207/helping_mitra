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

  const stateOptions = useMemo(() => {
    const stateField = fields.find((f) => f.fieldKey === 'stateName');
    if (!stateField) return [];
    const rules = stateField.validationRules
      ? typeof stateField.validationRules === 'string'
        ? JSON.parse(stateField.validationRules)
        : stateField.validationRules
      : {};
    return Array.isArray(rules.options) ? rules.options : [];
  }, [fields]);

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
  } = useForm<any>({
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

  const getFieldLabel = (key: string) => {
    const foundField = fields.find((f) => f.fieldKey === key);
    return foundField ? foundField.label : key;
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

            </div>
          </div>

          {/* Structured Details Review (Professional rendering) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
              Review Submitted Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-left">
              {Object.entries(tempPayloadState).map(([key, value]) => {
                if (key === 'uploads' || key === 'userId') return null;

                const fieldLabel = getFieldLabel(key);

                return (
                  <div key={key} className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      {fieldLabel}
                    </span>
                    <span className="text-sm font-bold text-slate-800 block select-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Document Attachments */}
            {tempPayloadState.uploads && Object.keys(tempPayloadState.uploads).length > 0 && (
              <div className="pt-4 border-t border-slate-200 text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2.5">
                  Attached Documents
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(tempPayloadState.uploads).map(([docKey, docVal]: any) => (
                    <span key={docKey} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {docKey}: {typeof docVal === 'string' ? docVal.split('/').pop() : 'Attached'}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
        {serviceSlug === 'pan-pdf-service' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            {/* Left Column: Form Fields */}
            <div className="space-y-5">
              {/* PAN Number */}
              <div className="space-y-2">
                <label htmlFor="field-panNumber" className="text-xs font-bold text-slate-700 tracking-wide block">
                  PAN Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="field-panNumber"
                  placeholder="ABCDE1234F"
                  {...register('panNumber' as any)}
                  className={`w-full bg-slate-50/50 border ${(errors as any).panNumber ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                    } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
                />
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">10 digit valid PAN number enter karein.</p>
                {(errors as any).panNumber && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).panNumber.message as string}
                  </p>
                )}
              </div>

              {/* Aadhaar Number */}
              <div className="space-y-2">
                <label htmlFor="field-aadhaarNumber" className="text-xs font-bold text-slate-700 tracking-wide block">
                  Aadhaar Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="field-aadhaarNumber"
                  placeholder="12 digit Aadhaar number"
                  {...register('aadhaarNumber' as any)}
                  className={`w-full bg-slate-50/50 border ${(errors as any).aadhaarNumber ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                    } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
                />
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">Aadhaar number without space enter karein.</p>
                {(errors as any).aadhaarNumber && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).aadhaarNumber.message as string}
                  </p>
                )}
              </div>

              {/* Date Of Birth */}
              <div className="space-y-2">
                <label htmlFor="field-dob" className="text-xs font-bold text-slate-700 tracking-wide block">
                  Date of Birth <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  id="field-dob"
                  {...register('dob' as any)}
                  className={`w-full bg-slate-50/50 border ${(errors as any).dob ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                    } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
                />
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">DOB PAN record ke according select karein.</p>
                {(errors as any).dob && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).dob.message as string}
                  </p>
                )}
              </div>

              {/* Aadhaar OTP Call Number */}
              <div className="space-y-2">
                <label htmlFor="field-aadhaarOtpCallNumber" className="text-xs font-bold text-slate-700 tracking-wide block">
                  Aadhaar OTP Call Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="field-aadhaarOtpCallNumber"
                  placeholder="Enter 10-digit mobile number"
                  {...register('aadhaarOtpCallNumber' as any)}
                  className={`w-full bg-slate-50/50 border ${(errors as any).aadhaarOtpCallNumber ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                    } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
                />
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">Enter mobile number for Aadhaar OTP.</p>
                {(errors as any).aadhaarOtpCallNumber && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).aadhaarOtpCallNumber.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Information & Notices */}
            <div className="space-y-5">
              {/* Aadhaar OTP Verification Notice Box */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 md:p-6 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs md:text-sm uppercase tracking-wide">
                  <span className="text-base">📞</span>
                  <h4>Aadhaar OTP Verification Notice</h4>
                </div>
                <p className="text-xs font-bold leading-relaxed text-amber-800/90">
                  Request submit hone ke baad hamari verification team customer se Aadhaar OTP verification ke liye sampark kar sakti hai. Call <span className="font-black text-amber-900 underline select-all">7999713744</span> se aa sakta hai. Customer ke Aadhaar registered mobile par prapt OTP verification ke liye pucha jayega. OTP verify hone ke baad hi NSDL PAN PDF request process hogi.
                </p>
              </div>

              {/* Important Information Box */}
              <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-5 md:p-6 text-blue-900 space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs md:text-sm uppercase tracking-wide">
                  <span className="text-base">ℹ️</span>
                  <h4>Important Information</h4>
                </div>
                <ul className="list-disc pl-5 text-xs font-bold space-y-2.5 text-blue-800">
                  <li>Service charge margin slab ke hisab se auto calculate hoga.</li>
                  <li>PAN, Aadhaar aur DOB details correct hona zaroori hai.</li>
                  <li>Wallet debit request submit ke time hoga.</li>
                  <li>Request normally 05-10 minutes me process ki ja sakti hai.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : serviceSlug === 'voter-pdf' ? (
          <div className="space-y-8 text-left">
            {/* Top Row: Warning and Info Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Important Information Box */}
              <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-5 md:p-6 text-blue-900 space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs md:text-sm uppercase tracking-wide">
                  <span className="text-base">ℹ️</span>
                  <h4>Important Information</h4>
                </div>
                <ul className="list-disc pl-5 text-xs font-bold space-y-2.5 text-blue-800">
                  <li>Service charge margin slab ke hisab se auto calculate hoga.</li>
                  <li>Safal request ke baad Voter PDF aam taur par 10 minute ke andar uplabdh ho jayega.</li>
                  <li>PDF link process hone ke baad request list me update hoga.</li>
                </ul>
              </div>

              {/* Note / Warning Box */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 md:p-6 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs md:text-sm uppercase tracking-wide">
                  <span className="text-base">⚠️</span>
                  <h4>Note</h4>
                </div>
                <ul className="list-disc pl-5 text-xs font-bold space-y-2 text-amber-850">
                  <li>Wrong Voter ID / State dene par request reject ho sakti hai.</li>
                  <li>Submit karne ke baad wallet se charge debit ho jayega.</li>
                </ul>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {/* Voter ID Number */}
              <div className="space-y-2">
                <label htmlFor="field-epicNumber" className="text-xs font-bold text-slate-700 tracking-wide block">
                  Voter ID Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="field-epicNumber"
                  placeholder="EXAMPLE: WGO1234567"
                  {...register('epicNumber' as any)}
                  className={`w-full bg-slate-50/50 border ${
                    (errors as any).epicNumber ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                  } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
                />
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">Complete Voter ID number enter karein.</p>
                {(errors as any).epicNumber && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).epicNumber.message as string}
                  </p>
                )}
              </div>

              {/* State Name */}
              <div className="space-y-2">
                <label htmlFor="field-stateName" className="text-xs font-bold text-slate-700 tracking-wide block">
                  Select State <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    id="field-stateName"
                    defaultValue=""
                    {...register('stateName' as any)}
                    className={`w-full bg-slate-50/50 border ${
                      (errors as any).stateName ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                    } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white appearance-none`}
                  >
                    <option value="" disabled>-- Select State --</option>
                    {stateOptions.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">Jis state me voter registered hai wahi select karein.</p>
                {(errors as any).stateName && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).stateName.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : serviceSlug === 'voter-mobile-number-link' ? (
          <div className="space-y-8 text-left">
            {/* Top Row: Warning and Info Boxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Important Information Box */}
              <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-5 md:p-6 text-blue-900 space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs md:text-sm uppercase tracking-wide">
                  <span className="text-base">ℹ️</span>
                  <h4>Important Information</h4>
                </div>
                <ul className="list-disc pl-5 text-xs font-bold space-y-2.5 text-blue-800">
                  <li>Service charge margin slab ke hisab se auto calculate hoga.</li>
                  <li>Mobile number link request process hone ke baad list me status update hoga.</li>
                  <li>OTP verification call user verification ke liye require ho sakti hai.</li>
                </ul>
              </div>

              {/* Note / Warning Box */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 md:p-6 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs md:text-sm uppercase tracking-wide">
                  <span className="text-base">⚠️</span>
                  <h4>Note</h4>
                </div>
                <ul className="list-disc pl-5 text-xs font-bold space-y-2 text-amber-850">
                  <li>Incorrect Voter ID or Mobile Number input se request fail/reject ho sakti hai.</li>
                  <li>Submit karne ke baad wallet se charge debit ho jayega.</li>
                </ul>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {/* Voter ID Number */}
              <div className="space-y-2">
                <label htmlFor="field-epicNumber" className="text-xs font-bold text-slate-700 tracking-wide block">
                  Voter ID Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="field-epicNumber"
                  placeholder="Enter EPIC Number"
                  {...register('epicNumber' as any)}
                  className={`w-full bg-slate-50/50 border ${
                    (errors as any).epicNumber ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                  } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
                />
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">Voter ID number without space enter karein.</p>
                {(errors as any).epicNumber && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).epicNumber.message as string}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <label htmlFor="field-mobileNumber" className="text-xs font-bold text-slate-700 tracking-wide block">
                  Mobile Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  id="field-mobileNumber"
                  placeholder="Enter 10-digit Mobile Number"
                  {...register('mobileNumber' as any)}
                  className={`w-full bg-slate-50/50 border ${
                    (errors as any).mobileNumber ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
                  } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
                />
                <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-1">10-digit active mobile number enter karein.</p>
                {(errors as any).mobileNumber && (
                  <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 mt-1">
                    <span>⚠️</span> {(errors as any).mobileNumber.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <DynamicSectionRenderer
            sections={formConfig.sections}
            register={register}
            errors={errors}
          />
        )}
      </form>
    </div>
  );
}
