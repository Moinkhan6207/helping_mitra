'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useOrderDetail } from '@/features/orders/hooks/useOrders';
import OrderDetailsCard from '@/features/orders/components/OrderDetailsCard';
import OrderTimeline from '@/features/orders/components/OrderTimeline';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }> | { orderId: string };
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter();
  
  // Resolve params cleanly (supports Next.js 14 and 15)
  const resolvedParams = React.use(
    params instanceof Promise ? params : Promise.resolve(params)
  );
  const { orderId } = resolvedParams;

  const { data: order, isLoading, isError, error } = useOrderDetail(orderId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Loader2 size={24} className="absolute animate-pulse text-[#145BFF]" />
        </div>
        <p className="text-xs text-slate-500 font-bold tracking-wide animate-pulse">
          Fetching application details...
        </p>
      </div>
    );
  }

  if (isError || !order) {
    const apiErr = error as any;
    const isNotFound = apiErr?.response?.data?.error?.code === 'ORDER_NOT_FOUND' || apiErr?.status === 404;

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-colors font-bold uppercase tracking-wider outline-none"
        >
          <ArrowLeft size={14} />
          Back to History
        </button>

        <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-12 flex flex-col items-center text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5 text-rose-500 shadow-sm">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
            {isNotFound ? 'Order Not Found' : 'Failed to Load Order'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
            {isNotFound
              ? 'This order could not be found, or you do not have permission to view it.'
              : 'An unexpected network error occurred while loading order information.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 outline-none"
          >
            My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none animate-in fade-in duration-300">
      {/* Header and Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="group flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest outline-none"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to History
        </button>
        <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100/50 rounded-full uppercase tracking-wider">
          Authorized Detail View
        </span>
      </div>

      {/* Main Order Details Cards */}
      <OrderDetailsCard order={order} />

      {/* Timeline Tracking */}
      <OrderTimeline
        status={order.orderStatus}
        createdAt={order.createdAt}
        updatedAt={order.updatedAt}
      />
    </div>
  );
}
