'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminCategories } from '@/features/admin-services/hooks/useAdminCategories';
import { useAdminServiceById, useAdminServices } from '@/features/admin-services/hooks/useAdminServices';
import ServiceForm from '@/features/admin-services/components/ServiceForm';
import ServiceFieldManager from '@/features/admin-services/components/ServiceFieldManager';
import ServiceDocumentManager from '@/features/admin-services/components/ServiceDocumentManager';
import { AdminServiceDetailsData } from '@/features/admin-services/types';
import { ShieldAlert } from 'lucide-react';

interface Params {
  id: string;
}

export default function EditServicePage({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const { id } = use(params);

  const { categories, isLoading: isCategoriesLoading } = useAdminCategories();
  const { data: service, isLoading: isServiceLoading, isError, error } = useAdminServiceById(id);
  const { updateService } = useAdminServices();

  const handleSubmit = async (data: Partial<AdminServiceDetailsData>) => {
    try {
      await updateService.mutateAsync({ id, data });
      router.push(`/admin/services/${id}`);
    } catch (err) {
      // Form displays error directly using error prop
    }
  };

  if (isCategoriesLoading || isServiceLoading) {
    return (
      <div className="space-y-8 animate-pulse select-none">
        <div className="h-8 bg-gray-100 rounded-xl w-1/4" />
        <div className="h-96 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-100 rounded-2xl" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert size={40} className="mx-auto text-red-400" />
        <h3 className="text-lg font-bold text-gray-800">Failed to Load Service Configurations</h3>
        <p className="text-xs text-red-500">
          {error instanceof Error ? error.message : 'Could not retrieve configurations from the server.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="pb-5 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Modify Service Configurations</h2>
        <p className="text-xs text-gray-500 mt-1">Configure parent form guidelines, pricing details, questionnaire flow, and files upload validation.</p>
      </div>

      {/* Core Edit Form */}
      <ServiceForm
        categories={categories}
        initialData={service}
        onSubmit={handleSubmit}
        isLoading={updateService.isPending}
        error={updateService.error}
      />

      {/* Managers Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start pt-6 border-t border-gray-200">
        <ServiceFieldManager
          serviceId={service.id}
          fields={service.fields || []}
        />
        <ServiceDocumentManager
          serviceId={service.id}
          documents={service.documentRequirements || []}
        />
      </div>
    </div>
  );
}
