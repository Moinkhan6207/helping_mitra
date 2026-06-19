'use client';

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ServiceFieldData } from '../types';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { Layers } from 'lucide-react';

interface FormSectionCardProps {
  sectionName: string;
  sectionOrder: number;
  fields: ServiceFieldData[];
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

/**
 * FormSectionCard
 *
 * Renders one logical section of the dynamic form.
 * Section name, order, and fields are ALL driven by the database —
 * this component never hardcodes any section layout.
 *
 * Layout rules:
 *  - TEXTAREA fields always span full width (md:col-span-2)
 *  - All other fields use a 2-column grid on desktop
 *  - Single column on mobile
 */
export default function FormSectionCard({
  sectionName,
  sectionOrder,
  fields,
  register,
  errors,
}: FormSectionCardProps) {
  // Colour accent rotates through a curated palette per section order (1-indexed)
  const accentPalette = [
    { dot: 'bg-blue-500', border: 'border-blue-100', bg: 'bg-blue-50/40', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    { dot: 'bg-indigo-500', border: 'border-indigo-100', bg: 'bg-indigo-50/40', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' },
    { dot: 'bg-violet-500', border: 'border-violet-100', bg: 'bg-violet-50/40', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
    { dot: 'bg-sky-500', border: 'border-sky-100', bg: 'bg-sky-50/40', text: 'text-sky-600', badge: 'bg-sky-100 text-sky-700' },
    { dot: 'bg-teal-500', border: 'border-teal-100', bg: 'bg-teal-50/40', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700' },
    { dot: 'bg-emerald-500', border: 'border-emerald-100', bg: 'bg-emerald-50/40', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  ];
  const accent = accentPalette[(sectionOrder - 1) % accentPalette.length];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
      {/* Section Title */}
      <h3 className="text-base font-extrabold text-slate-800 tracking-wide mb-5">
        {sectionName}
      </h3>

      {/* Section Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
        {fields.map((field) => (
          <DynamicFieldRenderer
            key={field.fieldKey}
            field={field}
            register={register}
            error={errors[field.fieldKey]?.message as string | undefined}
          />
        ))}
      </div>
    </div>
  );
}
