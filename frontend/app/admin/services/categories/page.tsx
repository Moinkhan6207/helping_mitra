'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminCategories } from '@/features/admin-services/hooks/useAdminCategories';
import CategoryTable from '@/features/admin-services/components/CategoryTable';
import CategoryForm from '@/features/admin-services/components/CategoryForm';
import { AdminCategoryData } from '@/features/admin-services/types';
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminCategoriesPage() {
  const { categories, isLoading, refetch, createCategory, updateCategory } = useAdminCategories();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryData | null>(null);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: AdminCategoryData) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: Partial<AdminCategoryData>) => {
    try {
      if (selectedCategory) {
        await updateCategory.mutateAsync({
          id: selectedCategory.id,
          data,
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      setIsModalOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      // Form displays error directly using error prop
    }
  };

  const activeMutationError = selectedCategory ? updateCategory.error : createCategory.error;
  const activeMutationLoading = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-blue transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Services Catalog</span>
          </Link>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Service Categories</h2>
          <p className="text-xs text-gray-500 mt-1">Manage parent category groups for organizing services in client menus.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all shadow-sm"
            title="Refresh List"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Categories Table */}
      <CategoryTable onEdit={handleOpenEdit} />

      {/* Category Creation / Edit Modal */}
      <CategoryForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSubmit={handleFormSubmit}
        isLoading={activeMutationLoading}
        error={activeMutationError}
      />
    </div>
  );
}
