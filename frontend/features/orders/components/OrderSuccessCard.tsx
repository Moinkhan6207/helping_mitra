'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Wallet, ArrowRight, Home, List } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderSuccessCardProps {
  orderNumber: string;
  orderId: string;
  serviceName: string;
  amountPaid: number;
  remainingBalance: number;
}

export default function OrderSuccessCard({
  orderNumber,
  orderId,
  serviceName,
  amountPaid,
  remainingBalance,
}: OrderSuccessCardProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white border border-slate-100 rounded-3xl shadow-xl p-8 text-center space-y-6 animate-in fade-in duration-300">
      {/* Visual Indicator */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75" />
        <div className="relative w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 shadow-inner">
          <BadgeCheck size={44} />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
          Fulfillment Triggered
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Application Submitted Successfully!
        </h1>
        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
          Your application has been received. The service fee has been deducted from your wallet balance.
        </p>
      </div>

      {/* Transaction Details Card */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-w-md mx-auto grid grid-cols-2 gap-4 text-left">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Order Number</p>
          <p className="text-sm font-black text-slate-900 tracking-tight mt-0.5 select-all font-mono">
            {orderNumber}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Order Status</p>
          <div className="mt-0.5">
            <OrderStatusBadge status="PENDING" />
          </div>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Service Name</p>
          <p className="text-xs font-bold text-slate-700 truncate mt-0.5" title={serviceName}>
            {serviceName}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Amount Paid</p>
          <p className="text-sm font-black text-rose-500 tracking-tight mt-0.5 tabular-nums">
            -{formatCurrency(amountPaid)}
          </p>
        </div>
        <div className="col-span-2 border-t border-slate-200/60 pt-3 flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5">
            <Wallet size={14} className="text-[#145BFF]" />
            Remaining Balance
          </span>
          <span className="text-slate-900 font-black tabular-nums">{formatCurrency(remainingBalance)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 outline-none"
        >
          <Home size={14} />
          Go Dashboard
        </button>
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 outline-none"
        >
          <List size={14} />
          My Orders
        </button>
        <button
          onClick={() => router.push(`/dashboard/orders/${orderId}`)}
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 outline-none"
        >
          View Order
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
