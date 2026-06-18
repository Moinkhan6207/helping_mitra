import React, { useState, useEffect } from 'react';
import { AdminCategoryData } from '../types';
import { X, AlertCircle } from 'lucide-react';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category: AdminCategoryData | null;
  onSubmit: (data: Partial<AdminCategoryData>) => void;
  isLoading: boolean;
  error: any;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  category,
  onSubmit,
  isLoading,
  error,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEdit = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || '');
      setDisplayOrder(category.displayOrder);
      setStatus(category.status);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setDisplayOrder(1);
      setStatus('ACTIVE');
    }
    setValidationError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (!isEdit) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Category Name is required.');
      return;
    }
    if (!slug.trim()) {
      setValidationError('Slug is required.');
      return;
    }
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setValidationError('Slug can only contain lowercase letters, numbers, and hyphens.');
      return;
    }

    if (isEdit && category && category.status === 'ACTIVE' && status === 'INACTIVE') {
      const confirmed = window.confirm(
        "Deactivating this category will hide all services under it from users. Continue?"
      );
      if (!confirmed) return;
    }

    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      displayOrder: Number(displayOrder),
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm cursor-pointer"
      />

      {/* Form Dialog */}
      <div className="relative w-full max-w-lg bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base font-bold text-gray-800">
            {isEdit ? 'Edit Category' : 'Create Category'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-4">

            {/* Server Error or Validation Error */}
            {(error || validationError) && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-3 text-xs leading-normal">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  {validationError || error?.response?.data?.message || error?.message || 'Something went wrong.'}
                </div>
              </div>
            )}

            {/* Name input */}
            <div className="space-y-1.5">
              <label htmlFor="category-name" className="text-xs font-bold text-gray-600">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. PAN Services"
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-sm text-gray-800 focus:outline-none transition-colors disabled:opacity-50 placeholder:text-gray-400"
              />
            </div>

            {/* Slug input */}
            <div className="space-y-1.5">
              <label htmlFor="category-slug" className="text-xs font-bold text-gray-600">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                id="category-slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="e.g. pan-services"
                disabled={isLoading || isEdit}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-sm text-gray-800 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400"
              />
              <p className="text-[10px] text-gray-400">
                Unique identifier used in URLs. Only lowercase, numbers, and hyphens.
              </p>
            </div>

            {/* Description textarea */}
            <div className="space-y-1.5">
              <label htmlFor="category-desc" className="text-xs font-bold text-gray-600">
                Description
              </label>
              <textarea
                id="category-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of services in this category"
                disabled={isLoading}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-sm text-gray-800 focus:outline-none transition-colors resize-none disabled:opacity-50 placeholder:text-gray-400"
              />
            </div>

            {/* Display Order + Status grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="category-order" className="text-xs font-bold text-gray-600">
                  Display Order
                </label>
                <input
                  id="category-order"
                  type="number"
                  min={1}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Math.max(1, Number(e.target.value)))}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-sm text-gray-800 focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category-status" className="text-xs font-bold text-gray-600">
                  Status
                </label>
                <select
                  id="category-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-sm text-gray-800 focus:outline-none transition-colors disabled:opacity-50"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary-blue/15 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              <span>{isEdit ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
