'use client';

import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string;
  fileName: string;
  onClose: () => void;
}

/**
 * ImagePreviewModal — Full-screen lightbox for uploaded image previews.
 * Closes on Escape key or backdrop click.
 */
export default function ImagePreviewModal({ src, fileName, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal content — stop propagation so clicking image doesn't close */}
      <div
        className="relative max-w-4xl max-h-[90vh] w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-sm font-semibold text-slate-700 truncate max-w-xs">{fileName}</span>
          <div className="flex items-center gap-2">
            <a
              href={src}
              download={fileName}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Download"
            >
              <Download size={16} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-4">
          <img
            src={src}
            alt={fileName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
          <p className="text-[11px] text-slate-400 text-center">Press Esc or click outside to close</p>
        </div>
      </div>
    </div>
  );
}
