'use client';

import React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { UploadMetadata } from '../types';

interface DocumentPreviewProps {
  metadata: UploadMetadata;
  previewUrl: string | null;
  onPreviewClick?: () => void;
}

/** Human-readable byte formatter */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * DocumentPreview — Shows uploaded file info.
 * Images: thumbnail preview.
 * PDFs: icon with filename badge.
 */
export default function DocumentPreview({ metadata, previewUrl, onPreviewClick }: DocumentPreviewProps) {
  const isImage = metadata.mimeType.startsWith('image/');

  return (
    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
      {/* Thumbnail or PDF icon */}
      {isImage && previewUrl ? (
        <button
          type="button"
          onClick={onPreviewClick}
          className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-200 shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:scale-105 transition-all outline-none"
          title="Click to preview image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="preview"
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0 text-red-500">
          <FileText size={20} />
        </div>
      )}

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-800 truncate">{metadata.fileName}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
          {metadata.mimeType === 'application/pdf' ? 'PDF' : metadata.mimeType.split('/')[1]?.toUpperCase()} · {formatBytes(metadata.fileSize)}
        </p>
      </div>
    </div>
  );
}

