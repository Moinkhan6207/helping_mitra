'use client';

import React from 'react';
import { Wallet, Receipt, AlertTriangle, CheckCircle } from 'lucide-react';

interface OrderSummaryCardProps {
  serviceName: string;
  serviceAmount: number;
  walletBalance: number;
  uploadedCount: number;
  requiredDocCount: number;
}

/**
 * OrderSummaryCard — Shows a financial summary before submission.
 * Highlights insufficient balance with a warning.
 */
export default function OrderSummaryCard({
  serviceName,
  serviceAmount,
  walletBalance,
  uploadedCount,
  requiredDocCount,
}: OrderSummaryCardProps) {
  const hasSufficientBalance = walletBalance >= serviceAmount;
  const remainingBalance = walletBalance - serviceAmount;
  const allDocsUploaded = uploadedCount >= requiredDocCount;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center gap-2">
        <Receipt size={15} className="text-slate-300" />
        <h3 className="text-sm font-bold text-white">Order Summary</h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Service */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium truncate max-w-[60%]">{serviceName}</span>
          <span className="font-bold text-slate-800">₹{serviceAmount.toFixed(2)}</span>
        </div>

        <div className="border-t border-dashed border-slate-100" />

        {/* Wallet Balance */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Wallet size={13} />
            <span>Wallet Balance</span>
          </div>
          <span className={`text-sm font-bold ${hasSufficientBalance ? 'text-emerald-600' : 'text-red-500'}`}>
            ₹{walletBalance.toFixed(2)}
          </span>
        </div>

        {/* After Deduction */}
        {hasSufficientBalance && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">After Deduction</span>
            <span className="text-xs font-bold text-slate-600">₹{remainingBalance.toFixed(2)}</span>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {!hasSufficientBalance && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600 font-semibold">
              Insufficient balance. You need ₹{(serviceAmount - walletBalance).toFixed(2)} more. Please contact admin to top up.
            </p>
          </div>
        )}

        {/* Documents status */}
        {requiredDocCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Documents</span>
            <div className={`flex items-center gap-1 text-xs font-bold ${allDocsUploaded ? 'text-emerald-600' : 'text-amber-600'}`}>
              {allDocsUploaded ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
              <span>{uploadedCount}/{requiredDocCount} uploaded</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
