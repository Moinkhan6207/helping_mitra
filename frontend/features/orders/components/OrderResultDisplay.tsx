'use client';

import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, Clock, Sparkles, Copy, Check } from 'lucide-react';
import { useOrderResult, useResultFileAccess } from '../hooks/useOrders';

interface OrderResultDisplayProps {
  orderId: string;
  orderStatus: string;
  completedAt?: string | null;
  userVisibleCompletionNote?: string | null;
  rejectedAt?: string | null;
  userVisibleRejectionReason?: string | null;
  refundStatus?: string;
  refundAmountPaise?: number | null;
  refundedAt?: string | null;
}

export default function OrderResultDisplay({
  orderId,
  orderStatus,
  completedAt,
  userVisibleCompletionNote,
  rejectedAt,
  userVisibleRejectionReason,
  refundStatus,
  refundAmountPaise,
  refundedAt,
}: OrderResultDisplayProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch result data only for completed orders
  const { data: resultData } = useOrderResult(
    orderId,
    orderStatus === 'SUCCESS'
  );

  const fileAccessMutation = useResultFileAccess(orderId);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amountPaise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amountPaise / 100);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async (action: 'VIEW' | 'DOWNLOAD') => {
    setDownloadError(null);
    try {
      const result = await fileAccessMutation.mutateAsync(action);
      
      if (action === 'DOWNLOAD') {
        const link = document.createElement('a');
        link.href = result.signedUrl;
        link.setAttribute('download', result.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access result file';
      setDownloadError(errorMessage);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // REJECTED ORDER VIEW
  if (orderStatus === 'REJECTED') {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-rose-50 rounded-xl">
            <AlertCircle size={20} className="text-rose-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Rejected</h3>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-rose-800 mb-1">Rejection Reason</p>
              <p className="text-sm text-rose-700 leading-relaxed">
                {userVisibleRejectionReason || 'No reason provided'}
              </p>
            </div>
          </div>
          <div className="text-[10px] text-rose-600 font-medium pt-2 border-t border-rose-200">
            Rejected on {formatDate(rejectedAt)}
          </div>
        </div>

        {/* REFUND VISIBILITY */}
        {refundStatus === 'COMPLETED' && refundAmountPaise ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-800 mb-1">Refund</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-emerald-700">
                    {formatCurrency(refundAmountPaise)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    has been returned to your Helping Mitra wallet
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium pt-2 border-t border-emerald-200">
              Refunded on {formatDate(refundedAt)}
            </div>
          </div>
        ) : refundStatus === 'NOT_REQUIRED' ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800 mb-1">Refund</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  No refund was issued.
                </p>
              </div>
            </div>
            <div className="text-[10px] text-slate-600 font-medium pt-2 border-t border-slate-200">
              Reason: {userVisibleRejectionReason || 'No reason provided'}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // PROCESSING STATE
  if (orderStatus === 'PENDING' || orderStatus === 'PROCESSING') {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Clock size={20} className="text-blue-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Status</h3>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-blue-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-blue-800">
                {orderStatus === 'PENDING' ? 'Your order is being processed' : 'Your order is being fulfilled'}
              </p>
              <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                {orderStatus === 'PENDING'
                  ? 'Admin is reviewing your application'
                  : 'Fulfillment and agency operations are ongoing'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS ORDER WITH RESULT
  if (orderStatus === 'SUCCESS' && resultData?.resultAvailable) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Completed</h3>
        </div>

        {/* COMPLETION NOTE */}
        {userVisibleCompletionNote && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-emerald-800 mb-1">Completion Message</p>
            <p className="text-sm text-emerald-700 leading-relaxed">{userVisibleCompletionNote}</p>
            <div className="text-[10px] text-emerald-600 font-medium mt-2 pt-2 border-t border-emerald-200">
              Completed on {formatDate(completedAt)}
            </div>
          </div>
        )}

        {/* TEXT RESULT */}
        {resultData.resultType === 'TEXT_RESULT' && resultData.textValue && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-800">
                {resultData.resultLabel || 'Result'}
              </p>
              <button
                onClick={() => handleCopy(resultData.textValue!)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-800"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                {resultData.textValue}
              </pre>
            </div>
          </div>
        )}

        {/* FILE RESULT */}
        {resultData.resultType === 'FILE_UPLOAD' && resultData.fileName && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 mb-1">
                  {resultData.resultLabel || 'Result Document'}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{resultData.fileName}</span>
                  <span>•</span>
                  <span>{resultData.fileType?.split('/')[1]?.toUpperCase()}</span>
                  <span>•</span>
                  <span>{resultData.fileSize ? formatBytes(resultData.fileSize) : 'N/A'}</span>
                </div>
              </div>
              <button
                onClick={() => handleDownload('DOWNLOAD')}
                disabled={fileAccessMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition shadow-sm disabled:cursor-not-allowed"
              >
                {fileAccessMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download size={14} />
                    Download
                  </>
                )}
              </button>
            </div>

            {downloadError && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-700">{downloadError}</p>
              </div>
            )}
          </div>
        )}

        {/* STATUS_ONLY */}
        {resultData.resultType === 'STATUS_ONLY' && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle size={16} />
              <p className="text-xs font-medium">This order has been completed successfully.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RESULT NOT AVAILABLE
  if (orderStatus === 'SUCCESS' && !resultData?.resultAvailable) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-amber-50 rounded-xl">
            <Clock size={20} className="text-amber-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Status</h3>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-amber-500" />
            <div>
              <p className="text-xs font-bold text-amber-800">Result not available yet</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                Your order has been completed but the result is being prepared. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
