'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import { UploadState } from '../types';
import UploadProgress from './UploadProgress';
import DocumentPreview from './DocumentPreview';
import UploadError from './UploadError';
import ImagePreviewModal from './ImagePreviewModal';

interface DocumentUploadFieldProps {
  documentKey: string;
  label: string;
  description?: string;
  isRequired?: boolean;
  state: UploadState;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export default function DocumentUploadField({
  documentKey,
  label,
  description,
  isRequired = false,
  state,
  onUpload,
  onRemove,
}: DocumentUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {/* Label and Info */}
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          {label}
          {isRequired && (
            <span className="text-red-500 font-extrabold text-xs" title="Required">
              *
            </span>
          )}
        </label>
        {state.status === 'success' && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Uploaded
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-slate-400 font-semibold leading-normal">{description}</p>
      )}

      {/* Main Container */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          disabled={state.status === 'uploading'}
        />

        {/* State: Idle / Empty */}
        {state.status === 'idle' && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
              <Upload size={20} className="animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-700">
                Drag &amp; drop or <span className="text-blue-600 underline">browse</span>
              </p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                Supports PDF, JPG, JPEG, PNG (Max 5MB)
              </p>
            </div>
          </div>
        )}

        {/* State: Uploading */}
        {state.status === 'uploading' && (
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80">
            <UploadProgress progress={state.progress} />
          </div>
        )}

        {/* State: Success */}
        {state.status === 'success' && state.metadata && (
          <div className="relative group">
            <DocumentPreview
              metadata={state.metadata}
              previewUrl={state.previewUrl}
              onPreviewClick={() => setIsPreviewOpen(true)}
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full border border-slate-200 shadow-sm hover:shadow transition-all"
              title="Remove File"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Full screen preview modal */}
        {isPreviewOpen && state.previewUrl && state.metadata && (
          <ImagePreviewModal
            src={state.previewUrl}
            fileName={state.metadata.fileName}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}


        {/* State: Error */}
        {state.status === 'error' && (
          <div className="space-y-2">
            <UploadError message={state.error ?? 'Upload failed'} />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onRemove}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onButtonClick}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                <RefreshCw size={10} />
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
