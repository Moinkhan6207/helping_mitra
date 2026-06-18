import React, { useState, useEffect } from 'react';
import { AdminCategoryData, AdminServiceDetailsData } from '../types';
import { ResultType } from '../../services/types';
import { AlertCircle, AlertTriangle, ArrowLeft, Lock, FileText, CheckCircle, AlignLeft } from 'lucide-react';
import Link from 'next/link';

interface ServiceFormProps {
  categories: AdminCategoryData[];
  initialData: AdminServiceDetailsData | null;
  onSubmit: (data: Partial<AdminServiceDetailsData>) => void;
  isLoading: boolean;
  error: any;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  categories,
  initialData,
  onSubmit,
  isLoading,
  error,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mrp, setMrp] = useState<number>(0);
  const [resultType, setResultType] = useState<ResultType>('STATUS_ONLY');
  const [resultLabel, setResultLabel] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEdit = !!initialData;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
      setCategoryId(initialData.categoryId);
      setMrp(initialData.mrp);
      setResultType(initialData.resultType);
      setResultLabel(initialData.resultLabel);
      setShortDescription(initialData.shortDescription);
      setDescription(initialData.description);
      setDisplayOrder(initialData.displayOrder);
      setStatus(initialData.status);
    } else {
      setName('');
      setSlug('');
      setCategoryId(categories[0]?.id || '');
      setMrp(0);
      setResultType('STATUS_ONLY');
      setResultLabel('');
      setShortDescription('');
      setDescription('');
      setDisplayOrder(1);
      setStatus('ACTIVE');
    }
    setValidationError(null);
  }, [initialData, categories]);

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

  const handleMrpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMrp(isNaN(val) ? 0 : val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) return setValidationError('Service Name is required.');
    if (!slug.trim()) return setValidationError('Slug is required.');
    if (!categoryId) return setValidationError('Category is required.');
    if (mrp < 0) return setValidationError('MRP (Fee) cannot be negative.');
    if (!resultLabel.trim()) return setValidationError('Result Label is required.');
    if (!shortDescription.trim()) return setValidationError('Short Description is required.');

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return setValidationError('Slug can only contain lowercase letters, numbers, and hyphens.');
    }

    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      categoryId,
      mrp: Number(mrp),
      resultType,
      resultLabel: resultLabel.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      displayOrder: Number(displayOrder),
      status,
    });
  };

  const showPriceChangeWarning = isEdit && initialData && Number(mrp) !== Number(initialData.mrp);

  // Shared input class
  const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-sm text-gray-800 focus:outline-none transition-colors disabled:opacity-50 placeholder:text-gray-400";
  const labelCls = "text-xs font-bold text-gray-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-blue transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Services List</span>
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-blue/20 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          )}
          <span>{isEdit ? 'Update Config' : 'Publish Service'}</span>
        </button>
      </div>

      {/* Errors Panel */}
      {(error || validationError) && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 text-xs leading-normal">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            {validationError || error?.response?.data?.message || error?.message || 'Something went wrong.'}
          </div>
        </div>
      )}

      {/* Price Change Warning banner */}
      {showPriceChangeWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-start gap-3 text-xs leading-normal animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <span className="font-bold">MRP (Fee) modification detected!</span>
            <p className="mt-1 text-amber-600">
              Saving will write an audit record linking old fee (₹{initialData.mrp.toFixed(2)}) to new fee (₹{Number(mrp).toFixed(2)}) along with your admin profile info.
            </p>
          </div>
        </div>
      )}

      {/* Form Grid Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Name input */}
          <div className="space-y-1.5">
            <label htmlFor="service-name" className={labelCls}>
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. PAN card Find Service"
              disabled={isLoading}
              className={inputCls}
            />
          </div>

          {/* Slug input */}
          <div className="space-y-1.5">
            <label htmlFor="service-slug" className={labelCls}>
              Service Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="service-slug"
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="e.g. pan-find-service"
              disabled={isLoading || isEdit}
              className={inputCls + ' disabled:cursor-not-allowed'}
            />
            <p className="text-[10px] text-gray-400">Only lowercase letters, numbers, and hyphens.</p>
          </div>

          {/* Category SELECT */}
          <div className="space-y-1.5">
            <label htmlFor="service-category" className={labelCls}>
              Category Group <span className="text-red-500">*</span>
            </label>
            <select
              id="service-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isLoading}
              className={inputCls}
            >
              <option value="" disabled>Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* MRP input */}
          <div className="space-y-1.5">
            <label htmlFor="service-mrp" className={labelCls}>
              MRP (Fee in ₹) <span className="text-red-500">*</span>
            </label>
            <input
              id="service-mrp"
              type="number"
              min={0}
              step="0.01"
              value={mrp}
              onChange={handleMrpChange}
              placeholder="0.00"
              disabled={isLoading}
              className={inputCls + ' font-mono'}
            />
          </div>

          {/* Result Type — Read-Only in Edit Mode */}
          {isEdit ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className={labelCls}>Result Delivery Mechanism</label>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Lock size={8} />
                  Phase 2 Read-Only
                </span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                {resultType === 'FILE_UPLOAD' && <FileText size={16} className="text-blue-500 shrink-0" />}
                {resultType === 'STATUS_ONLY' && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
                {resultType === 'TEXT_RESULT' && <AlignLeft size={16} className="text-purple-500 shrink-0" />}
                <div>
                  <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">{resultType}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {resultType === 'FILE_UPLOAD' && 'Admin uploads a file (PDF/image) as the order result.'}
                    {resultType === 'STATUS_ONLY' && 'Admin marks the order status (Approved / Rejected) — no file.'}
                    {resultType === 'TEXT_RESULT' && 'Admin enters a text value (e.g. PAN Number) as the result.'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Controlled by seed data. Editable in Phase 3.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="service-result-type" className={labelCls}>
                Result Delivery Mechanism <span className="text-red-500">*</span>
              </label>
              <select
                id="service-result-type"
                value={resultType}
                onChange={(e) => setResultType(e.target.value as ResultType)}
                disabled={isLoading}
                className={inputCls}
              >
                <option value="STATUS_ONLY">STATUS_ONLY (Text update like Success/Verified)</option>
                <option value="TEXT_RESULT">TEXT_RESULT (Outputs text value like PAN Number)</option>
                <option value="FILE_UPLOAD">FILE_UPLOAD (Upload PDF certificate)</option>
              </select>
            </div>
          )}

          {/* Result Label — Read-Only in Edit Mode */}
          {isEdit ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className={labelCls}>Result Input / File Label</label>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Lock size={8} />
                  Phase 2 Read-Only
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-sm font-bold text-primary-blue">{resultLabel || '—'}</span>
              </div>
              <p className="text-[10px] text-gray-400">Label for the result output. Editable in Phase 3.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="service-result-label" className={labelCls}>
                Result Input/File Label <span className="text-red-500">*</span>
              </label>
              <input
                id="service-result-label"
                type="text"
                value={resultLabel}
                onChange={(e) => setResultLabel(e.target.value)}
                placeholder="e.g. Uploaded PAN PDF"
                disabled={isLoading}
                className={inputCls}
              />
              <p className="text-[10px] text-gray-400">Label shown when displaying results (e.g. "PAN Card Copy").</p>
            </div>
          )}

          {/* Display Order input */}
          <div className="space-y-1.5">
            <label htmlFor="service-order" className={labelCls}>
              Display Sort Order
            </label>
            <input
              id="service-order"
              type="number"
              min={1}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Math.max(1, Number(e.target.value)))}
              disabled={isLoading}
              className={inputCls}
            />
          </div>

          {/* Status SELECT */}
          <div className="space-y-1.5">
            <label htmlFor="service-status" className={labelCls}>
              Service Status <span className="text-red-500">*</span>
            </label>
            <select
              id="service-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={isLoading}
              className={inputCls}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

        </div>

        {/* Short Description */}
        <div className="space-y-1.5">
          <label htmlFor="service-short-desc" className={labelCls}>
            Short Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="service-short-desc"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief 1-2 sentence description shown in service list discovery..."
            disabled={isLoading}
            rows={2}
            className={inputCls + ' resize-none'}
          />
        </div>

        {/* Long Description */}
        <div className="space-y-1.5">
          <label htmlFor="service-desc" className={labelCls}>
            Full Service Guidelines & Description
          </label>
          <textarea
            id="service-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details guidelines, processing timelines, terms and customer descriptions..."
            disabled={isLoading}
            rows={5}
            className={inputCls + ' resize-y'}
          />
        </div>

      </div>
    </form>
  );
};

export default ServiceForm;
