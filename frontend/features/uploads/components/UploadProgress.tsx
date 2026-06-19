'use client';

import React from 'react';

interface UploadProgressProps {
  progress: number; // 0–100
}

/**
 * UploadProgress — Animated progress bar.
 * Uses real Firebase upload progress, not a fake timer.
 */
export default function UploadProgress({ progress }: UploadProgressProps) {
  const pct = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider animate-pulse">
          Uploading…
        </span>
        <span className="text-[10px] font-black text-slate-700 tabular-nums">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
