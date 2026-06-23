'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/authStore';
import { useAdminDashboardSummary } from '@/features/dashboard/hooks/useAdminDashboardSummary';
import {
  Users,
  Briefcase,
  Layers,
  Award,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Users2,
  Settings,
  Shield,
  FileSpreadsheet,
  Wallet,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  Package,
  IndianRupee,
  ArrowRight,
  Tag,
  TrendingUp,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboardSummary();

  const handleRetry = () => {
    refetch();
  };

  const summary = data?.data;

  // Render skeleton loaders during initial fetch (updated to light theme)
  if (isLoading) {
    return (
      <div className="space-y-8 select-none">
        {/* Welcome Banner Skeleton */}
        <div className="h-24 bg-white border border-slate-200 rounded-3xl animate-pulse p-6 flex flex-col justify-between">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-250 rounded w-1/4"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse p-5"
            >
              <div className="h-4 bg-slate-150 rounded w-1/2 mb-4"></div>
              <div className="h-5 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Placeholders Grid Skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-36 bg-white border border-slate-200 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render Error boundary panel
  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 text-red-650 rounded-3xl flex flex-col items-center justify-center text-center gap-4 max-w-lg mx-auto mt-12 shadow-sm">
        <AlertTriangle size={40} className="text-red-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-800">Failed to Load System Metrics</h3>
          <p className="text-sm text-red-600/80 mt-1">
            {error instanceof Error ? error.message : 'A network error occurred while communicating with the server.'}
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-750 text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md shadow-red-600/10"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <span>Retry Request</span>
        </button>
      </div>
    );
  }

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Info Banner */}
      <div className="relative p-6 bg-gradient-to-r from-[#0c1a30] via-[#112a52] to-[#145bff] rounded-3xl overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg">
        {/* Banner highlight line */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-[#f59e0b]" />

        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Administrator, <span className="text-[#f59e0b]">{user?.name}</span>
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1">System monitoring dashboard. Oversee regional distributor registrations and wallet balances</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-wider uppercase bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
            <Shield size={10} />
            <span>{user?.role}</span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full">
            {user?.status}
          </span>
        </div>
      </div>

      {/* Database Statistics Summary Panel */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-800">User Registries Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Users */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.totalUsers || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Partners (Users)</p>
            </div>
          </div>

          {/* Total Retailers */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center text-[#145BFF] shrink-0">
              <Briefcase size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.totalRetailers || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Retailers Network</p>
            </div>
          </div>

          {/* Total Distributors */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.totalDistributors || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Distributors Network</p>
            </div>
          </div>

          {/* Total Master Distributors */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-150 flex items-center justify-center text-teal-600 shrink-0">
              <Award size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.totalMasterDistributors || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Master Distributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Kiosk Order Summary Panel */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-800">Kiosk Orders Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Orders */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.totalOrders || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">System Kiosk Orders</p>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-500 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.pendingOrders || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pending Verification</p>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-emerald-600 leading-none">{summary?.completedOrders || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Completed Orders</p>
            </div>
          </div>

          {/* Rejected Orders */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-500 shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-red-500 leading-none">{summary?.rejectedOrders || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Rejected Orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Recharges Summary — Phase 4 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800">Wallet Recharges Summary</h3>
          <Link href="/admin/wallet/recharges">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#145BFF] hover:text-blue-700 transition-colors duration-150 cursor-pointer">
              Manage Recharges
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Verification Pending */}
          <Link
            href="/admin/wallet/recharges?status=VERIFICATION_PENDING"
            className="group p-4.5 bg-white border border-blue-100 hover:border-blue-300 rounded-2xl flex items-center gap-3.5 transition-all hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Clock size={18} className="animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.pendingRecharges ?? 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Verification Pending</p>
            </div>
          </Link>

          {/* Under Review */}
          <Link
            href="/admin/wallet/recharges?status=UNDER_REVIEW"
            className="group p-4.5 bg-white border border-amber-100 hover:border-amber-300 rounded-2xl flex items-center gap-3.5 transition-all hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <FileCheck size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.underReviewRecharges ?? 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Under Review</p>
            </div>
          </Link>

          {/* Credited Today */}
          <div className="p-4.5 bg-white border border-emerald-100 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-emerald-600 leading-none">{summary?.rechargesCreditedToday ?? 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Credited Today</p>
            </div>
          </div>

          {/* Rejected Today */}
          <div className="p-4.5 bg-white border border-rose-100 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <p className="text-lg font-black text-red-500 leading-none">{summary?.rechargesRejectedToday ?? 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Rejected Today</p>
            </div>
          </div>

        </div>
      </div>

      {/* Service Catalogue Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800">Service Catalogue Stats</h3>
          <Link href="/admin/services">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#145BFF] hover:text-blue-700 transition-colors duration-150 cursor-pointer">
              Manage Services
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Categories */}
          <Link
            href="/admin/services/categories"
            className="group p-5 bg-white border border-slate-200 hover:border-indigo-400/85 rounded-2xl flex flex-col justify-between h-28 transition-all duration-200 hover:shadow-md hover:shadow-slate-100/60"
          >
            <div className="flex items-center justify-between text-slate-450">
              <span className="text-xs font-bold uppercase tracking-wider">Total Categories</span>
              <Tag size={16} className="text-indigo-500/80" />
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {summary?.totalCategories ?? 0}
              </span>
              <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                View →
              </span>
            </div>
          </Link>

          {/* Total Services */}
          <Link
            href="/admin/services"
            className="group p-5 bg-white border border-slate-200 hover:border-blue-400/85 rounded-2xl flex flex-col justify-between h-28 transition-all duration-200 hover:shadow-md hover:shadow-slate-100/60"
          >
            <div className="flex items-center justify-between text-slate-450">
              <span className="text-xs font-bold uppercase tracking-wider">Total Services</span>
              <Package size={16} className="text-[#145BFF]" />
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {summary?.totalServices ?? 0}
              </span>
              <span className="text-[9px] text-[#145BFF] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                View →
              </span>
            </div>
          </Link>

          {/* Active Services */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-450">
              <span className="text-xs font-bold uppercase tracking-wider">Active Services</span>
              <LayoutGrid size={16} className="text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">
                {summary?.activeServices ?? 0}
              </span>
            </div>
          </div>

          {/* Inactive Services */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-450">
              <span className="text-xs font-bold uppercase tracking-wider">Inactive Services</span>
              <LayoutGrid size={16} className="text-slate-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-400 tracking-tight">
                {summary?.inactiveServices ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Service Updates */}
      {summary?.recentServices && summary.recentServices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800">Recent Service Updates</h3>
            <Link href="/admin/services">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer">
                View All
                <ArrowRight size={13} />
              </span>
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-slate-400 font-bold px-5 py-3 uppercase tracking-wider">Service</th>
                  <th className="text-left text-slate-400 font-bold px-5 py-3 hidden sm:table-cell uppercase tracking-wider">Category</th>
                  <th className="text-left text-slate-400 font-bold px-5 py-3 uppercase tracking-wider">MRP</th>
                  <th className="text-left text-slate-400 font-bold px-5 py-3 uppercase tracking-wider">Status</th>
                  <th className="text-right text-slate-400 font-bold px-5 py-3 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentServices.map((svc, idx) => (
                  <tr
                    key={svc.id}
                    className={`border-b border-slate-100 hover:bg-slate-50/30 transition-colors duration-150 ${
                      idx === summary.recentServices.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-bold text-slate-800">{svc.name}</td>
                    <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{svc.category.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                        <IndianRupee size={10} />{svc.mrp}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          svc.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {svc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/services/${svc.id}`}>
                        <span className="text-[#145BFF] hover:underline font-bold text-[10px]">View →</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Quick Action Shortcuts */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-800">System Management Panels</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 1: User Management */}
          <div className="group p-5 bg-white border border-slate-200 hover:border-slate-350 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 hover:shadow-md hover:shadow-slate-100/65 hover:-translate-y-0.5 select-none">
            <div>
              <Users2 size={20} className="text-[#145BFF] mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-black text-slate-700 group-hover:text-slate-900">User Management</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">Audit partner registrations, PAN details, state/district locations.</p>
            </div>
            <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full w-max mt-2 uppercase tracking-wide">
              Coming Soon
            </span>
          </div>

          {/* Card 2: Service Management */}
          <Link href="/admin/services" className="group p-5 bg-white border border-slate-200 hover:border-blue-400/80 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 hover:shadow-md hover:shadow-slate-100/65 hover:-translate-y-0.5 select-none cursor-pointer">
            <div>
              <Settings size={20} className="text-indigo-600 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-black text-slate-700 group-hover:text-slate-900">Service Config</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">Configure Samagra, PAN find, and voter lookup APIs.</p>
            </div>
            <span className="text-[8px] font-bold text-white bg-[#145BFF] px-2 py-0.5 rounded-full w-max mt-2 uppercase tracking-wide">
              Configure
            </span>
          </Link>

          {/* Card 3: Order Management */}
          <div className="group p-5 bg-white border border-slate-200 hover:border-slate-350 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 hover:shadow-md hover:shadow-slate-100/65 hover:-translate-y-0.5 select-none">
            <div>
              <ShoppingBag size={20} className="text-teal-600 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-black text-slate-700 group-hover:text-slate-900">Kiosk Orders</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">Audit, verify, complete, or reject partner service logs.</p>
            </div>
            <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full w-max mt-2 uppercase tracking-wide">
              Coming Soon
            </span>
          </div>

          {/* Card 4: Wallet & Settlements */}
          <Link href="/admin/wallet/recharges" className="group p-5 bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 hover:shadow-md hover:shadow-slate-100/65 hover:-translate-y-0.5 select-none cursor-pointer">
            <div>
              <Wallet size={20} className="text-amber-500 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-black text-slate-700 group-hover:text-slate-900">Wallet & Payments</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">Review UPI verifications, approve top-ups, manage recharge queue.</p>
            </div>
            <span className="text-[8px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full w-max mt-2 uppercase tracking-wide">
              Manage →
            </span>
          </Link>

          {/* Card 5: System Reports */}
          <div className="group p-5 bg-white border border-slate-200 hover:border-slate-350 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 hover:shadow-md hover:shadow-slate-100/65 hover:-translate-y-0.5 select-none">
            <div>
              <FileSpreadsheet size={20} className="text-emerald-500 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-black text-slate-700 group-hover:text-slate-900">Reports Ledger</h4>
              <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">Export audit logs, user counts, and transaction summaries.</p>
            </div>
            <span className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full w-max mt-2 uppercase tracking-wide">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

