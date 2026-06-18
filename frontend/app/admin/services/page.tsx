'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminServices } from '@/features/admin-services/hooks/useAdminServices';
import { useAdminCategories } from '@/features/admin-services/hooks/useAdminCategories';
import ServiceTable from '@/features/admin-services/components/ServiceTable';
import PriceHistoryModal from '@/features/admin-services/components/PriceHistoryModal';
import UpdateMrpModal from '@/features/admin-services/components/UpdateMrpModal';
import { AdminServiceListItem } from '@/features/admin-services/types';
import { Grid, RefreshCw, FolderEdit, LayoutGrid, ToggleLeft, ToggleRight, Search } from 'lucide-react';

export default function AdminServicesDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [priceHistoryServiceId, setPriceHistoryServiceId] = useState<string | null>(null);
  const [mrpTarget, setMrpTarget] = useState<AdminServiceListItem | null>(null);

  // Queries
  const { categories } = useAdminCategories();

  // Query with filters for table
  const {
    servicesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    updateService,
    updateStatus,
  } = useAdminServices({
    page,
    limit: 10,
    search: search.trim() || undefined,
    category: category || undefined,
    status: status || undefined,
  });

  // Query all services (limit 1000) for general stats cards
  const { servicesData: statsData } = useAdminServices({
    page: 1,
    limit: 1000,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleStatusToggle = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const newStatus: 'ACTIVE' | 'INACTIVE' = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const label = currentStatus === 'ACTIVE' ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      currentStatus === 'ACTIVE'
        ? `Deactivating this service will hide it from users. Continue?`
        : `Activating this service will make it visible to users. Continue?`
    );
    if (!confirmed) return;
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
    } catch (err) {
      alert(`Failed to ${label} service. Please try again.`);
    }
  };

  // Compute stats
  const totalServices = statsData?.pagination?.total || 0;
  const activeServices = statsData?.services?.filter((s: any) => s.status === 'ACTIVE').length || 0;
  const inactiveServices = statsData?.services?.filter((s: any) => s.status === 'INACTIVE').length || 0;
  const totalCategories = categories?.length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Services Catalog</h2>
          <p className="text-xs text-gray-500 mt-1">Configure service definitions, MRP fees, dynamic form inputs, and required documents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/services/categories"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm"
          >
            <FolderEdit size={14} className="text-indigo-500" />
            <span>Manage Categories</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between h-28 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Services</span>
            <div className="p-2 bg-slate-100 rounded-lg">
              <LayoutGrid size={14} className="text-slate-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-gray-800 tracking-tight">{totalServices}</span>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">All services</p>
          </div>
        </div>

        {/* Active Services */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between h-28 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Active</span>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <ToggleRight size={16} className="text-emerald-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">{activeServices}</span>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Live services</p>
          </div>
        </div>

        {/* Inactive Services */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between h-28 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Inactive</span>
            <div className="p-2 bg-amber-50 rounded-lg">
              <ToggleLeft size={16} className="text-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 tracking-tight">{inactiveServices}</span>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Disabled services</p>
          </div>
        </div>

        {/* Total Categories */}
        <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between h-28 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Categories</span>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Grid size={14} className="text-indigo-500" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-600 tracking-tight">{totalCategories}</span>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Service groups</p>
          </div>
        </div>
      </div>

      {/* Filter and Table section */}
      <div className="space-y-4">
        {/* Filters control panel */}
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-xs text-gray-700 focus:outline-none transition-colors placeholder:text-gray-400"
              />
            </div>

            {/* Category Select */}
            <div className="w-full md:w-48">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-xs text-gray-700 focus:outline-none transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="w-full md:w-36">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-primary-blue focus:bg-white rounded-xl text-xs text-gray-700 focus:outline-none transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-gray-500 hover:text-gray-700 rounded-xl transition-all w-full md:w-auto flex items-center justify-center gap-2 text-xs font-semibold"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            <span className="md:hidden">Refresh List</span>
          </button>
        </div>

        {/* Services Table UI */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium">
            Failed to load services: {error instanceof Error ? error.message : 'Unknown network error'}
          </div>
        ) : (
          <ServiceTable
            services={servicesData?.services || []}
            pagination={servicesData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }}
            onPageChange={handlePageChange}
            onStatusToggle={handleStatusToggle}
            onShowPriceHistory={setPriceHistoryServiceId}
            onUpdateMrp={(service) => setMrpTarget(service)}
            isStatusChanging={updateStatus.isPending}
          />
        )}
      </div>

      {/* Price History popup modal */}
      {priceHistoryServiceId && (
        <PriceHistoryModal
          serviceId={priceHistoryServiceId}
          isOpen={!!priceHistoryServiceId}
          onClose={() => setPriceHistoryServiceId(null)}
        />
      )}

      {/* Update MRP Modal */}
      {mrpTarget && (
        <UpdateMrpModal
          serviceId={mrpTarget.id}
          serviceName={mrpTarget.name}
          currentMrp={mrpTarget.mrp}
          isOpen={!!mrpTarget}
          onClose={() => setMrpTarget(null)}
          onSuccess={() => setMrpTarget(null)}
        />
      )}
    </div>
  );
}
