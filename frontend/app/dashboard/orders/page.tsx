'use client';

import React, { useState, useMemo } from 'react';
import { useOrders } from '@/features/orders/hooks/useOrders';
import OrderFilters from '@/features/orders/components/OrderFilters';
import OrderListTable from '@/features/orders/components/OrderListTable';
import { FileText } from 'lucide-react';

export default function OrdersCataloguePage() {
  const [filters, setFilters] = useState<{
    orderStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>({
    orderStatus: undefined,
    search: '',
    startDate: undefined,
    endDate: undefined,
  });

  const [page, setPage] = useState(1);

  // Fetch orders with current filters & pagination
  const { data, isLoading } = useOrders({
    page,
    limit: 15,
    orderStatus: filters.orderStatus,
    search: filters.search || undefined,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // Fetch all user orders to compute dynamic statistics summary in header
  const { data: allOrdersData } = useOrders({
    page: 1,
    limit: 1000,
  });

  const allOrders = allOrdersData?.orders ?? [];

  const stats = useMemo(() => {
    let totalPaid = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let inProgressCount = 0;
    let rejectedCount = 0;
    let cancelledCount = 0;

    allOrders.forEach((o) => {
      totalPaid += Number(o.orderAmount);
      if (o.orderStatus === 'COMPLETED') completedCount++;
      else if (o.orderStatus === 'PENDING') pendingCount++;
      else if (o.orderStatus === 'IN_PROGRESS') inProgressCount++;
      else if (o.orderStatus === 'REJECTED') rejectedCount++;
      else if (o.orderStatus === 'CANCELLED') cancelledCount++;
    });

    return {
      all: allOrders.length,
      success: completedCount,
      processing: pendingCount + inProgressCount,
      objection: cancelledCount,
      uploadPending: 0, // Mocked 0 to match UI requirements in Image 2
      rejected: rejectedCount,
      totalPaid,
    };
  }, [allOrders]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset page to 1 on filter change
  };

  const handleFilterSelect = (status?: string) => {
    setFilters((prev) => ({
      ...prev,
      orderStatus: status,
    }));
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* List of PAN Cards Stats Header Card matching Image 2 */}
      <div className="bg-[#111c38] text-white rounded-3xl p-5 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-md border border-[#1e2e56]">
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div className="p-3 bg-white/10 rounded-2xl text-blue-400">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">List of PAN Cards</h2>
            <p className="text-xs text-slate-400 font-medium">Digital service applications history</p>
          </div>
        </div>

        {/* Dynamic Summary Stats Panel */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* ALL */}
          <div className="flex flex-col items-center bg-[#1e2d52] px-4 py-2 rounded-xl min-w-[70px] border border-white/5">
            <span className="text-base font-extrabold text-white">{stats.all}</span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider mt-0.5">ALL</span>
          </div>
          {/* SUCCESS */}
          <div className="flex flex-col items-center bg-emerald-950/80 border border-emerald-500/20 px-4 py-2 rounded-xl min-w-[75px]">
            <span className="text-base font-extrabold text-emerald-400">{stats.success}</span>
            <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wider mt-0.5">SUCCESS</span>
          </div>
          {/* PROCESSING */}
          <div className="flex flex-col items-center bg-blue-950/80 border border-blue-500/20 px-4 py-2 rounded-xl min-w-[85px]">
            <span className="text-base font-extrabold text-blue-400">{stats.processing}</span>
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-wider mt-0.5">PROCESSING</span>
          </div>
          {/* OBJECTION */}
          <div className="flex flex-col items-center bg-amber-950/80 border border-amber-500/20 px-4 py-2 rounded-xl min-w-[80px]">
            <span className="text-base font-extrabold text-amber-400">{stats.objection}</span>
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider mt-0.5">OBJECTION</span>
          </div>
          {/* UPLOAD PENDING */}
          <div className="flex flex-col items-center bg-rose-950/60 border border-rose-500/20 px-4 py-2 rounded-xl min-w-[100px]">
            <span className="text-base font-extrabold text-rose-400">{stats.uploadPending}</span>
            <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider mt-0.5">UPLOAD PENDING</span>
          </div>
          {/* REJECTED */}
          <div className="flex flex-col items-center bg-rose-950/80 border border-rose-500/20 px-4 py-2 rounded-xl min-w-[75px]">
            <span className="text-base font-extrabold text-rose-400">{stats.rejected}</span>
            <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider mt-0.5">REJECTED</span>
          </div>
          {/* TOTAL PAID */}
          <div className="flex flex-col items-center bg-slate-900 border border-white/10 px-5 py-2 rounded-xl min-w-[100px]">
            <span className="text-base font-extrabold text-yellow-400 tabular-nums">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(stats.totalPaid)}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">TOTAL PAID</span>
          </div>
        </div>
      </div>

      {/* Button-based Filter Tabs matching Image 2 */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-2">Filter:</span>

        <button
          onClick={() => handleFilterSelect(undefined)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider ${
            filters.orderStatus === undefined
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
          }`}
        >
          All
        </button>

        <button
          onClick={() => handleFilterSelect('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider flex items-center gap-1.5 ${
            filters.orderStatus === 'COMPLETED'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 border border-emerald-100'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              filters.orderStatus === 'COMPLETED' ? 'bg-white' : 'bg-emerald-500'
            }`}
          />
          Success
        </button>

        <button
          onClick={() => handleFilterSelect('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider flex items-center gap-1.5 ${
            filters.orderStatus === 'PENDING'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-blue-50 hover:bg-blue-100/70 text-blue-700 border border-blue-100'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              filters.orderStatus === 'PENDING' ? 'bg-white' : 'bg-blue-500'
            }`}
          />
          Processing
        </button>

        <button
          onClick={() => handleFilterSelect('CANCELLED')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider flex items-center gap-1.5 ${
            filters.orderStatus === 'CANCELLED'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-amber-50 hover:bg-amber-100/70 text-amber-700 border border-amber-100'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              filters.orderStatus === 'CANCELLED' ? 'bg-white' : 'bg-amber-500'
            }`}
          />
          Objection
        </button>

        <button
          onClick={() => handleFilterSelect('IN_PROGRESS')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider flex items-center gap-1.5 ${
            filters.orderStatus === 'IN_PROGRESS'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-rose-50 hover:bg-rose-100/70 text-rose-700 border border-rose-100'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              filters.orderStatus === 'IN_PROGRESS' ? 'bg-white' : 'bg-rose-500'
            }`}
          />
          Upload Pending
        </button>

        <button
          onClick={() => handleFilterSelect('REJECTED')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider flex items-center gap-1.5 ${
            filters.orderStatus === 'REJECTED'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-rose-50 hover:bg-rose-100/70 text-rose-700 border border-rose-100'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              filters.orderStatus === 'REJECTED' ? 'bg-white' : 'bg-rose-500'
            }`}
          />
          Rejected
        </button>
      </div>

      {/* Advanced filters inputs (collapsible / secondary) */}
      <OrderFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Upgraded Detailed Grid List matching Image 2 */}
      <OrderListTable
        orders={data?.orders ?? []}
        pagination={
          data?.pagination ?? {
            page: 1,
            limit: 15,
            total: 0,
            totalPages: 1,
          }
        }
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
