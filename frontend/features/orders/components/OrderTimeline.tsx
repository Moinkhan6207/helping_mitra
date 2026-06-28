'use client';

import React from 'react';
import { Check, Clock, AlertTriangle, XCircle, Play } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  processingStartedAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  refundedAt?: string | null;
  refundStatus?: string;
}

export default function OrderTimeline({ 
  status, 
  createdAt, 
  updatedAt,
  processingStartedAt,
  completedAt,
  rejectedAt,
  refundedAt,
  refundStatus,
}: OrderTimelineProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine timeline steps based on status (user-friendly, no internal admin actions)
  // FR-5.32: Use dedicated timestamps rather than relying only on updatedAt
  const steps = [
    {
      title: 'Order Submitted',
      description: 'Application submitted and service fee debited from wallet.',
      date: createdAt,
      isCompleted: true,
      icon: <Check size={12} className="text-white" />,
      color: 'bg-emerald-500',
    },
  ];

  if (status === 'PENDING') {
    steps.push({
      title: 'Pending Review',
      description: 'Your application is being reviewed by our team.',
      date: createdAt,
      isCompleted: false,
      icon: <Clock size={12} className="text-amber-600 animate-pulse" />,
      color: 'bg-amber-100 border border-amber-300',
    });
  }

  if (status === 'PROCESSING' || status === 'IN_PROGRESS') {
    steps.push({
      title: 'Processing Started',
      description: 'Your order is being processed and fulfilled.',
      date: processingStartedAt || updatedAt,
      isCompleted: true,
      icon: <Check size={12} className="text-white" />,
      color: 'bg-emerald-500',
    });
    steps.push({
      title: 'In Progress',
      description: 'Fulfillment operations are ongoing.',
      date: updatedAt,
      isCompleted: false,
      icon: <Play size={12} className="text-blue-600 animate-pulse" />,
      color: 'bg-blue-100 border border-blue-300',
    });
  }

  if (status === 'SUCCESS' || status === 'COMPLETED') {
    if (processingStartedAt) {
      steps.push({
        title: 'Processing Started',
        description: 'Your order was processed successfully.',
        date: processingStartedAt,
        isCompleted: true,
        icon: <Check size={12} className="text-white" />,
        color: 'bg-emerald-500',
      });
    }
    steps.push({
      title: 'Order Completed',
      description: 'Your order has been completed successfully.',
      date: completedAt || updatedAt,
      isCompleted: true,
      icon: <Check size={12} className="text-white" />,
      color: 'bg-emerald-500',
    });
  }

  if (status === 'REJECTED') {
    if (processingStartedAt) {
      steps.push({
        title: 'Processing Started',
        description: 'Your order was reviewed.',
        date: processingStartedAt,
        isCompleted: true,
        icon: <Check size={12} className="text-white" />,
        color: 'bg-emerald-500',
      });
    }
    steps.push({
      title: 'Order Rejected',
      description: 'Your order was rejected. Please check the rejection reason.',
      date: rejectedAt || updatedAt,
      isCompleted: true,
      icon: <AlertTriangle size={12} className="text-white" />,
      color: 'bg-rose-500',
    });
    if (refundedAt && refundStatus === 'COMPLETED') {
      steps.push({
        title: 'Wallet Refunded',
        description: 'Refund has been processed to your wallet.',
        date: refundedAt,
        isCompleted: true,
        icon: <Check size={12} className="text-white" />,
        color: 'bg-emerald-500',
      });
    }
  }

  if (status === 'CANCELLED') {
    steps.push({
      title: 'Cancelled',
      description: 'Order was cancelled.',
      date: updatedAt,
      isCompleted: true,
      icon: <XCircle size={12} className="text-white" />,
      color: 'bg-slate-500',
    });
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6">Status Timeline</h3>
      
      <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-8">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Timeline Dot Icon */}
            <span className={`absolute -left-9.25 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${step.color}`}>
              {step.icon}
            </span>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>{step.title}</span>
                {step.date && (
                  <span className="text-[10px] text-slate-400 font-semibold tabular-nums">
                    {formatDate(step.date)}
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
