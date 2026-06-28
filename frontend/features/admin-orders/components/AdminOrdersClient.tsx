'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  useAdminOrders, 
  useAdminOrderStats, 
  useAdminsList 
} from '../hooks/useAdminOrders';
import { useServices } from '@/features/services/hooks/useServices';
import { AdminOrderQueryFilters } from '../types';
import { OrderStatus } from '../../orders/types';
import { useAuthStore } from '@/features/auth/authStore';
import { 
  Search, 
  Filter, 
  Calendar, 
  IndianRupee, 
  User, 
  ArrowUpDown, 
  RefreshCw, 
  AlertCircle, 
  Inbox, 
  ArrowRight,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminOrdersClient: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status') || '';

  // Filters state
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<AdminOrderQueryFilters>({
    page: 1,
    limit: 20,
    search: '',
    orderStatus: (statusParam as any) || '',
    serviceId: '',
    assignedAdminId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'orderStatus',
    sortOrder: 'asc',
  });

  // Sync statusParam when URL query changes
  useEffect(() => {
    if (statusParam !== undefined) {
      setFilters((prev) => ({
        ...prev,
        orderStatus: (statusParam as any) || '',
        page: 1,
      }));
    }
  }, [statusParam]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput,
        page: 1, // reset page to 1 on new search
      }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // React Query queries with date range parameters
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useAdminOrderStats({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const { data: adminsList = [], isLoading: adminsLoading } = useAdminsList();
  
  // Fetch active services for dropdown (limit 100 is enough to get all services)
  const { data: servicesData } = useServices({ page: 1, limit: 100 });
  const activeServices = servicesData?.services || [];

  const { 
    data: ordersData, 
    isLoading: ordersLoading, 
    isFetching: ordersFetching,
    isError: ordersError, 
    refetch: refetchOrders 
  } = useAdminOrders(filters);

  // Handlers
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleFilterChange = (key: keyof AdminOrderQueryFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // reset page to 1 on filter change
    }));
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      orderStatus: '',
      serviceId: '',
      assignedAdminId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'orderStatus',
      sortOrder: 'asc',
    });
  };

  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
  };

  // Helper: Format amount in Paise to INR
  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(paise / 100);
  };

  // Helper: Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper: Render status badges
  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<string, { bg: string; label: string }> = {
      PENDING: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
        label: 'Pending'
      },
      PROCESSING: {
        bg: 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
        label: 'Processing'
      },
      SUCCESS: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
        label: 'Completed'
      },
      REJECTED: {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25',
        label: 'Rejected'
      },
      // Fallback legacy values
      IN_PROGRESS: {
        bg: 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
        label: 'Processing'
      },
      COMPLETED: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
        label: 'Completed'
      },
      CANCELLED: {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25',
        label: 'Cancelled'
      }
    };

    const statusConfig = config[status] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border leading-none ${statusConfig.bg}`}>
        {statusConfig.label}
      </span>
    );
  };

  const isFilterActive = 
    filters.search !== '' ||
    filters.orderStatus !== '' ||
    filters.serviceId !== '' ||
    filters.assignedAdminId !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.minAmount !== '' ||
    filters.maxAmount !== '' ||
    filters.sortBy !== 'orderStatus' ||
    filters.sortOrder !== 'asc';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-white flex items-center gap-3">
            <ClipboardList className="text-[#145BFF]" size={28} />
            Orders Management
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Monitor, assign, and manage customer service applications in the queue system.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-xs transition active:scale-[0.98]"
        >
          <RefreshCw size={14} className={ordersFetching ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* Summary dashboard metrics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Orders Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 leading-none">Total Orders</span>
            <p className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white">
              {statsLoading ? '...' : (stats?.total || 0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shadow-xs dark:bg-slate-800 dark:border-slate-750">
            <ClipboardList size={18} />
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-500 leading-none">Pending</span>
            <p className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white">
              {statsLoading ? '...' : (stats?.pending || 0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-xs dark:bg-amber-500/10 dark:border-amber-500/20">
            <Clock size={18} />
          </div>
        </div>

        {/* Processing Orders Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-wider text-blue-500 leading-none">Processing</span>
            <p className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white">
              {statsLoading ? '...' : (stats?.processing || 0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-xs dark:bg-blue-500/10 dark:border-blue-500/20">
            <RefreshCw size={18} />
          </div>
        </div>

        {/* Completed Orders Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-500 leading-none">Completed</span>
            <p className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white">
              {statsLoading ? '...' : (stats?.completed || 0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-xs dark:bg-emerald-500/10 dark:border-emerald-500/20">
            <CheckCircle size={18} />
          </div>
        </div>

        {/* Rejected Orders Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs col-span-2 lg:col-span-1 flex items-center justify-between relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-wider text-rose-500 leading-none">Rejected</span>
            <p className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white">
              {statsLoading ? '...' : (stats?.rejected || 0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs dark:bg-rose-500/10 dark:border-rose-500/20">
            <XCircle size={18} />
          </div>
        </div>

      </div>

      {/* Filters & Search section */}
      <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={16} />
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">Search & Advanced Filters</span>
          </div>
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition self-start lg:self-auto bg-red-50 px-3 py-1.5 rounded-lg active:scale-[0.98]"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Search</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Order ID, Customer, Mobile..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Status</label>
            <select
              value={filters.orderStatus}
              onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SUCCESS">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Service Type</label>
            <select
              value={filters.serviceId}
              onChange={(e) => handleFilterChange('serviceId', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="">All Services</option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Queue & Assignment Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Assignment & Queue</label>
            <select
              value={
                filters.orderStatus === 'PROCESSING'
                  ? 'processing'
                  : filters.assignedAdminId === 'unassigned'
                  ? 'unassigned'
                  : filters.assignedAdminId === 'assigned'
                  ? 'assigned'
                  : currentUser?.id && filters.assignedAdminId === currentUser.id
                  ? 'assigned-to-me'
                  : filters.assignedAdminId || ''
              }
              onChange={(e) => {
                const val = e.target.value;
                setFilters((prev) => {
                  const next = { ...prev, page: 1 };
                  if (val === 'assigned-to-me') {
                    next.assignedAdminId = currentUser?.id || '';
                  } else if (val === 'assigned') {
                    next.assignedAdminId = 'assigned';
                  } else if (val === 'unassigned') {
                    next.assignedAdminId = 'unassigned';
                  } else if (val === 'processing') {
                    next.orderStatus = 'PROCESSING';
                    next.assignedAdminId = '';
                  } else {
                    next.assignedAdminId = val;
                    if (val === '' && prev.orderStatus === 'PROCESSING') {
                      next.orderStatus = '';
                    }
                  }
                  return next;
                });
              }}
              disabled={adminsLoading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="">All Orders</option>
              <option value="assigned-to-me">Assigned To Me</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value="processing">Processing</option>
              <optgroup label="Specific Administrator">
                {adminsList.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-100 pt-5 dark:border-slate-800/80">
          
          {/* Date Range Filter */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Created Date Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full pl-8.5 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase">to</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full pl-8.5 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Amount Range Filter */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Amount Range (₹)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase">to</span>
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Sorting */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Sort By</label>
            <div className="flex items-center gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-medium focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="orderStatus">Status Priority</option>
                <option value="createdAt">Created Date</option>
                <option value="orderAmountPaise">Order Amount</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-medium focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

        </div>

      </div>

      {/* Orders list Queue table / card view */}
      {ordersError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20">
          <AlertCircle size={28} className="mx-auto mb-3 text-rose-500" />
          <h3 className="font-extrabold text-sm">Failed to Load Orders</h3>
          <p className="text-xs text-rose-600/80 mt-1">There was an error communicating with the API. Please try again.</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl text-xs font-semibold transition active:scale-[0.98]"
          >
            Retry
          </button>
        </div>
      ) : ordersLoading ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#145BFF] animate-spin"></div>
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Orders Queue...</p>
        </div>
      ) : !ordersData || ordersData.orders.length === 0 ? (
        // Empty States
        <div className="text-center py-20 bg-white border border-slate-150 rounded-3xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <Inbox className="mx-auto text-slate-200 mb-4 dark:text-slate-800" size={48} />
          <h3 className="text-sm font-extrabold text-slate-700 dark:text-white">
            {isFilterActive ? 'No Matching Orders' : 'No Orders Found'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isFilterActive 
              ? 'Try modifying your search text, adjusting filters, or clearing date ranges.' 
              : 'There are currently no orders placed in the system.'}
          </p>
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="mt-5 px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-[0.98] dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-slate-150 bg-white rounded-3xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800/60">
                <thead className="bg-slate-50 text-slate-450 font-extrabold uppercase tracking-wider dark:bg-slate-800/40">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Order number</th>
                    <th className="px-6 py-4 whitespace-nowrap">User name</th>
                    <th className="px-6 py-4 whitespace-nowrap">Mobile</th>
                    <th className="px-6 py-4 whitespace-nowrap">User type</th>
                    <th className="px-6 py-4 whitespace-nowrap">Service</th>
                    <th className="px-6 py-4 whitespace-nowrap">Category</th>
                    <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap">Payment status</th>
                    <th className="px-6 py-4 whitespace-nowrap">Refund status</th>
                    <th className="px-6 py-4 whitespace-nowrap">Assigned admin</th>
                    <th className="px-6 py-4 whitespace-nowrap">Created date</th>
                    <th className="px-6 py-4 whitespace-nowrap">Last updated date</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white dark:divide-slate-800/40 dark:bg-slate-900">
                  {ordersData.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group dark:hover:bg-slate-800/20">
                      
                      {/* Order Number */}
                      <td className="px-6 py-4 font-bold text-slate-800 text-xs font-mono dark:text-white whitespace-nowrap">
                        {order.orderNumber}
                      </td>

                      {/* User Name */}
                      <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-slate-200 whitespace-nowrap">
                        {order.user.name}
                      </td>

                      {/* Mobile */}
                      <td className="px-6 py-4 text-slate-500 font-mono font-semibold dark:text-slate-400 whitespace-nowrap">
                        {order.user.mobile}
                      </td>

                      {/* User Type */}
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] whitespace-nowrap">
                        {order.user.userType?.replace(/_/g, ' ') || 'Partner'}
                      </td>

                      {/* Service */}
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {order.serviceNameSnapshot}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">
                        {order.categoryNameSnapshot}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-mono font-extrabold text-slate-850 text-xs dark:text-white whitespace-nowrap">
                        {formatCurrency(order.orderAmountPaise)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.orderStatus)}
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Refund Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          order.refundStatus === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'bg-slate-55 text-slate-500 border-slate-200 dark:bg-slate-850 dark:text-slate-400'
                        }`}>
                          {order.refundStatus === 'COMPLETED' ? 'Refunded' : 'N/A'}
                        </span>
                      </td>

                      {/* Assigned Admin */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-250">
                          <User size={12} className="text-slate-400" />
                          <span>{order.assignedAdminName}</span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-slate-500 font-semibold dark:text-slate-400 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Last Updated Date */}
                      <td className="px-6 py-4 text-slate-500 font-semibold dark:text-slate-400 whitespace-nowrap">
                        {formatDate(order.updatedAt)}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-[#145BFF] hover:border-[#145BFF] hover:text-white text-slate-700 font-bold rounded-xl text-[10px] transition active:scale-[0.98] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-[#145BFF]"
                        >
                          View Details
                          <ArrowRight size={11} />
                        </Link>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {ordersData.orders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4 dark:bg-slate-900 dark:border-slate-800">
                
                <div className="flex items-center justify-between border-b border-slate-50 pb-3 dark:border-slate-800/80">
                  <span className="font-bold text-slate-900 font-mono text-xs dark:text-white">{order.orderNumber}</span>
                  {getStatusBadge(order.orderStatus)}
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                  
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Customer</span>
                    <p className="font-extrabold text-slate-850 dark:text-slate-250 truncate">{order.user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{order.user.mobile}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Service</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{order.serviceNameSnapshot}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Amount</span>
                    <p className="font-mono font-extrabold text-slate-900 dark:text-white">{formatCurrency(order.orderAmountPaise)}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Assignment & Processing</span>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                        <User size={11} className="text-slate-450" />
                        {order.assignedAdminName}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-black rounded uppercase border leading-none ${
                          order.assignedAdminId
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400'
                            : 'bg-slate-55 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}>
                          {order.assignedAdminId ? 'Assigned' : 'Unassigned'}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-black rounded uppercase border leading-none ${
                          order.processingStartedAt || order.orderStatus === 'PROCESSING'
                            ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                            : 'bg-slate-55 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}>
                          {order.processingStartedAt || order.orderStatus === 'PROCESSING' ? 'Started' : 'Not Started'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5 col-span-2">
                    <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Created Date</span>
                    <p className="font-semibold text-slate-600 dark:text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>

                </div>

                <Link
                  href={`/admin/orders/${order.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-[#145BFF] hover:border-[#145BFF] hover:text-white text-slate-700 font-bold rounded-xl text-xs transition active:scale-[0.98] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  View Details
                  <ArrowRight size={13} />
                </Link>

              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2 text-xs text-slate-500">
            
            {/* Limit selector & count labels */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-400">Rows per page:</span>
                <select
                  value={filters.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></span>
              <div>
                Showing <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {((filters.page || 1) - 1) * (filters.limit || 20) + 1}
                </span> to <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {Math.min((filters.page || 1) * (filters.limit || 20), ordersData.pagination.total)}
                </span> of <span className="font-extrabold text-slate-805 dark:text-slate-200">
                  {ordersData.pagination.total}
                </span> records
              </div>
            </div>

            {/* Navigation buttons */}
            {ordersData.pagination.totalPages > 1 && (
              <div className="flex items-center gap-1 bg-white border border-slate-150 rounded-xl p-1 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <button
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                  className="p-2 hover:bg-slate-55 disabled:opacity-30 text-slate-700 dark:text-white rounded-lg transition disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-slate-800 dark:text-white font-extrabold px-3 select-none">
                  Page {filters.page} of {ordersData.pagination.totalPages}
                </div>
                <button
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={filters.page === ordersData.pagination.totalPages}
                  className="p-2 hover:bg-slate-55 disabled:opacity-30 text-slate-700 dark:text-white rounded-lg transition disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminOrdersClient;
