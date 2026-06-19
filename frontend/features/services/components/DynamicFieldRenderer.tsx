'use client';

import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ServiceFieldData } from '../types';
import { ChevronDown } from 'lucide-react';

interface DynamicFieldRendererProps {
  field: ServiceFieldData;
  register: UseFormRegister<any>;
  error?: string;
}

/**
 * DynamicFieldRenderer
 *
 * Renders the correct HTML input element for each field type.
 * For SELECT fields, reads options from validationRules.options —
 * no option lists are hardcoded here.
 *
 * TEXTAREA always spans full width (md:col-span-2).
 */
const getColSpan = (field: ServiceFieldData) => {
  if (field.fieldType === 'TEXTAREA') return 'md:col-span-3';
  const key = field.fieldKey.toLowerCase();
  if (key === 'applicantname' || key === 'fullname') return 'md:col-span-2';
  if (key === 'email' || key === 'emailid' || key === 'email_id') return 'md:col-span-2';
  if (key === 'address' || key === 'fulladdress') return 'md:col-span-3';
  return 'md:col-span-1';
};

export default function DynamicFieldRenderer({ field, register, error }: DynamicFieldRendererProps) {
  // Parse options for SELECT type from validationRules
  const getSelectOptions = (): Array<{ label: string; value: string }> => {
    if (field.fieldType !== 'SELECT' || !field.validationRules) return [];

    const rules =
      typeof field.validationRules === 'string'
        ? JSON.parse(field.validationRules)
        : field.validationRules;

    if (Array.isArray(rules.options)) {
      return rules.options.map((opt: any) => {
        if (typeof opt === 'string') return { label: opt, value: opt };
        return {
          label: opt.label ?? opt.value ?? '',
          value: opt.value ?? opt.label ?? '',
        };
      });
    }
    return [];
  };

  const inputId = `field-${field.fieldKey}`;
  const hasError = Boolean(error);

  const baseInputStyle = `w-full bg-white border ${
    hasError
      ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
  } rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none`;

  const renderInput = () => {
    switch (field.fieldType) {
      case 'TEXTAREA':
        return (
          <textarea
            id={inputId}
            placeholder={field.placeholder ?? `Enter ${field.label}`}
            {...register(field.fieldKey)}
            rows={3}
            className={`${baseInputStyle} resize-y leading-relaxed`}
          />
        );

      case 'SELECT': {
        const options = getSelectOptions();
        return (
          <div className="relative">
            <select
              id={inputId}
              {...register(field.fieldKey)}
              className={`${baseInputStyle} appearance-none cursor-pointer pr-10`}
              defaultValue=""
            >
              <option value="" disabled className="text-slate-400">
                {field.placeholder ?? `Select ${field.label}`}
              </option>
              {options.map((opt, idx) => (
                <option key={idx} value={opt.value} className="text-slate-700 font-medium">
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Custom chevron arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>
        );
      }

      case 'NUMBER':
        return (
          <input
            id={inputId}
            type="number"
            placeholder={field.placeholder ?? `Enter ${field.label}`}
            {...register(field.fieldKey)}
            className={baseInputStyle}
          />
        );

      case 'DATE':
        return (
          <input
            id={inputId}
            type="date"
            {...register(field.fieldKey)}
            className={baseInputStyle}
          />
        );

      case 'EMAIL':
        return (
          <input
            id={inputId}
            type="email"
            placeholder={field.placeholder ?? `Enter ${field.label}`}
            {...register(field.fieldKey)}
            className={baseInputStyle}
          />
        );

      case 'MOBILE':
        return (
          <input
            id={inputId}
            type="tel"
            maxLength={10}
            placeholder={field.placeholder ?? `Enter ${field.label}`}
            {...register(field.fieldKey)}
            className={baseInputStyle}
          />
        );

      case 'TEXT':
      default:
        return (
          <input
            id={inputId}
            type="text"
            placeholder={field.placeholder ?? `Enter ${field.label}`}
            {...register(field.fieldKey)}
            className={baseInputStyle}
          />
        );
    }
  };

  const colSpan = getColSpan(field);

  return (
    <div className={`space-y-1.5 ${colSpan}`}>
      <label
        htmlFor={inputId}
        className="text-xs font-bold text-slate-700 tracking-wide mb-1 block"
      >
        {field.label}
        {field.isRequired && (
          <span className="text-red-500 font-black text-sm leading-none ml-0.5">*</span>
        )}
      </label>

      {renderInput()}

      {error && (
        <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
