'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderDetail } from '@/features/orders/hooks/useOrders';
import { useWalletBalance } from '@/features/wallet/useWalletBalance';
import OrderSuccessCard from '@/features/orders/components/OrderSuccessCard';
import { Loader2 } from 'lucide-react';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading } = useOrderDetail(orderId ?? '');
  const { data: walletData } = useWalletBalance();

  if (!orderId) {
    React.useEffect(() => {
      router.push('/dashboard');
    }, [router]);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={36} className="animate-spin text-[#145BFF]" />
        <p className="text-xs text-slate-500 font-bold tracking-wide uppercase animate-pulse">
          Generating Receipt details...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-8 bg-white rounded-3xl border border-slate-100 max-w-md mx-auto my-12 shadow-md">
        <p className="text-sm text-slate-500 font-semibold">Could not load order details.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          Go Dashboard
        </button>
      </div>
    );
  }

  return (
    <OrderSuccessCard
      orderNumber={order.orderNumber}
      orderId={order.id}
      serviceName={order.serviceNameSnapshot}
      amountPaid={Number(order.orderAmount)}
      remainingBalance={walletData?.balance ?? 0}
    />
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={36} className="animate-spin text-[#145BFF]" />
          <p className="text-xs text-slate-500 font-bold tracking-wide uppercase animate-pulse">
            Loading...
          </p>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
