'use client';

import React from 'react';
import { Check, Clock, AlertTriangle, XCircle, Play } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export default function OrderTimeline({ status, createdAt, updatedAt }: OrderTimelineProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine timeline steps based on status
  const steps = [
    {
      title: 'Order Created',
      description: 'Application submitted and service fee debited from wallet.',
      date: createdAt,
      isCompleted: true,
      icon: <Check size={12} className="text-white" />,
      color: 'bg-emerald-500',
    },
    {
      title: 'Pending Review',
      description: 'Admin is verifying documents and questionnaire details.',
      date: status === 'PENDING' ? undefined : createdAt,
      isCompleted: status !== 'PENDING',
      icon: status === 'PENDING' ? <Clock size={12} className="text-amber-600 animate-pulse" /> : <Check size={12} className="text-white" />,
      color: status === 'PENDING' ? 'bg-amber-100 border border-amber-300' : 'bg-emerald-500',
    },
  ];

  if (status === 'IN_PROGRESS') {
    steps.push({
      title: 'In Progress',
      description: 'Fulfillment and agency operations are ongoing.',
      date: updatedAt,
      isCompleted: false,
      icon: <Play size={12} className="text-blue-600 animate-pulse" />,
      color: 'bg-blue-100 border border-blue-300',
    });
  } else if (status === 'COMPLETED') {
    steps.push({
      title: 'Completed',
      description: 'Digital service certificate or result delivered successfully.',
      date: updatedAt,
      isCompleted: true,
      icon: <Check size={12} className="text-white" />,
      color: 'bg-emerald-500',
    });
  } else if (status === 'REJECTED') {
    steps.push({
      title: 'Rejected',
      description: 'Application rejected. Check order details or refund status.',
      date: updatedAt,
      isCompleted: true,
      icon: <AlertTriangle size={12} className="text-white" />,
      color: 'bg-rose-500',
    });
  } else if (status === 'CANCELLED') {
    steps.push({
      title: 'Cancelled',
      description: 'Order was cancelled by customer or merchant.',
      date: updatedAt,
      isCompleted: true,
      icon: <XCircle size={12} className="text-white" />,
      color: 'bg-slate-500',
    });
  } else {
    // Just a placeholder for future steps
    steps.push({
      title: 'Fulfillment',
      description: 'Fulfillment result delivery pending.',
      date: undefined,
      isCompleted: false,
      icon: <Clock size={12} className="text-slate-400" />,
      color: 'bg-slate-100 border border-slate-200',
    });
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6">Status Timeline</h3>
      
      <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-8">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Timeline Dot Icon */}
            <span className={`absolute -left-[37px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${step.color}`}>
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
