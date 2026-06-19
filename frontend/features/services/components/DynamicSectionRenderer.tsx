'use client';

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FormSection } from '../types';
import FormSectionCard from './FormSectionCard';

interface DynamicSectionRendererProps {
  sections: FormSection[];
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

/**
 * DynamicSectionRenderer
 *
 * Consumes the sections[] array from the backend Section Grouping Engine
 * and renders each section as a FormSectionCard in display order.
 *
 * Zero hardcoding — section names, order, and fields are all from the DB.
 */
export default function DynamicSectionRenderer({
  sections,
  register,
  errors,
}: DynamicSectionRendererProps) {
  if (!sections || sections.length === 0) return null;

  // Sort by sectionOrder as a safety measure (backend already sorts, but defensive)
  const orderedSections = [...sections].sort((a, b) => a.sectionOrder - b.sectionOrder);

  return (
    <div className="space-y-4">
      {orderedSections.map((section) => (
        <FormSectionCard
          key={section.sectionName}
          sectionName={section.sectionName}
          sectionOrder={section.sectionOrder}
          fields={section.fields}
          register={register}
          errors={errors}
        />
      ))}
    </div>
  );
}
