'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UploadErrorProps {
  message: string;
}

/**
 * UploadError — Compact inline error alert for document upload rejections.
 */
export default function UploadError({ message }: UploadErrorProps) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
      <p className="text-[11px] text-red-700 font-bold leading-normal">{message}</p>
    </div>
  );
}
