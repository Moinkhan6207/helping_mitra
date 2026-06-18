import React from 'react';
import { AdminCategoryData } from '../types';
import { StatusToggle } from './StatusToggle';
import { Edit, Folder } from 'lucide-react';
import { useAdminCategories } from '../hooks/useAdminCategories';

interface CategoryTableProps {
  onEdit: (category: AdminCategoryData) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({ onEdit }) => {
  const { categories, isLoading, isError, error, updateCategory } = useAdminCategories();

  const handleStatusToggle = (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    if (currentStatus === 'ACTIVE') {
      const confirmed = window.confirm(
        "Deactivating this category will hide all services under it from users. Continue?"
      );
      if (!confirmed) return;
    }

    updateCategory.mutate({
      id,
      data: { status: newStatus },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-medium">
        Failed to load categories: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-2xl">
        <Folder className="mx-auto text-gray-300 mb-3" size={36} />
        <p className="text-sm font-semibold text-gray-500">No categories found</p>
        <p className="text-xs text-gray-400 mt-1">Create your first category to start cataloging services.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-100 bg-white rounded-2xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Category Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Display Order</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <span className="font-bold text-gray-800 text-sm">{category.name}</span>
                    {category.description && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-xs">{category.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                  {category.slug}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-600">
                  {category.displayOrder}
                </td>
                <td className="px-6 py-4">
                  <StatusToggle
                    status={category.status}
                    onChange={() => handleStatusToggle(category.id, category.status)}
                    disabled={updateCategory.isPending}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onEdit(category)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-blue/10 hover:bg-primary-blue/20 border border-primary-blue/20 text-primary-blue rounded-xl text-[11px] font-semibold transition-colors"
                  >
                    <Edit size={12} />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;
