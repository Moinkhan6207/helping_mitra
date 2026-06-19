'use client';

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface OrderFiltersProps {
  filters: {
    orderStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange: (newFilters: any) => void;
}

export default function OrderFilters({ filters, onFilterChange }: OrderFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, orderStatus: e.target.value || undefined });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, startDate: e.target.value || undefined });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, endDate: e.target.value || undefined });
  };

  const handleReset = () => {
    onFilterChange({
      orderStatus: undefined,
      search: '',
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Filter Orders</h3>
        <button
          onClick={handleReset}
          className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={10} />
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Order #</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={filters.search ?? ''}
              onChange={handleSearchChange}
              placeholder="e.g. HM-2026-000001"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/50"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
          <select
            value={filters.orderStatus ?? ''}
            onChange={handleStatusChange}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all bg-slate-50/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Date Range From */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
          <input
            type="date"
            value={filters.startDate ?? ''}
            onChange={handleStartDateChange}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all bg-slate-50/50 cursor-pointer"
          />
        </div>

        {/* Date Range To */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
          <input
            type="date"
            value={filters.endDate ?? ''}
            onChange={handleEndDateChange}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all bg-slate-50/50 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
