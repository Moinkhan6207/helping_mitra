'use client';

import React from 'react';
import { Clock, Play, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  let icon = <Clock size={12} />;
  let styles = 'bg-blue-50 text-blue-600 border-blue-100';
  let label = 'PROCESSING';

  switch (status) {
    case 'PENDING':
      icon = <Clock size={11} className="animate-pulse text-blue-500" />;
      styles = 'bg-blue-50 text-blue-600 border-blue-100';
      label = 'PROCESSING';
      break;
    case 'PROCESSING':
    case 'IN_PROGRESS':
      icon = <Play size={11} className="animate-pulse text-rose-500" />;
      styles = 'bg-rose-50 text-rose-600 border-rose-100';
      label = 'UPLOAD PENDING';
      break;
    case 'SUCCESS':
    case 'COMPLETED':
      icon = <CheckCircle2 size={11} className="text-emerald-500" />;
      styles = 'bg-emerald-50 text-emerald-600 border-emerald-100';
      label = 'SUCCESS';
      break;
    case 'REJECTED':
      icon = <AlertCircle size={11} className="text-rose-500" />;
      styles = 'bg-rose-50 text-rose-600 border-rose-100';
      label = 'REJECTED';
      break;
    case 'CANCELLED':
      icon = <XCircle size={11} className="text-amber-500" />;
      styles = 'bg-amber-50 text-amber-600 border-amber-100';
      label = 'OBJECTION';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-wider ${styles}`}
    >
      {icon}
      {label}
    </span>
  );
}
