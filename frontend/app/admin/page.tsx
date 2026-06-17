'use client';

import React from 'react';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboardSummary();

  const handleRetry = () => {
    refetch();
  };

  const summary = data?.data;

  // Render skeleton loaders during initial fetch
  if (isLoading) {
    return (
      <div className="space-y-8 select-none">
        {/* Welcome Banner Skeleton */}
        <div className="h-24 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse p-6 flex flex-col gap-3">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse p-5"
            >
              <div className="h-3 bg-slate-800 rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-slate-800 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Placeholders Grid Skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-slate-900 rounded w-1/6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-36 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
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
      <div className="p-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl flex flex-col items-center justify-center text-center gap-4 max-w-lg mx-auto mt-12">
        <AlertTriangle size={40} className="text-red-400" />
        <div>
          <h3 className="text-lg font-bold text-white">Failed to Load System metrics</h3>
          <p className="text-sm text-red-400/80 mt-1">
            {error instanceof Error ? error.message : 'A network error occurred while communicating with the server.'}
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-white rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <span>Retry Request</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Info Banner */}
      <div className="relative p-6 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Banner highlight line */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary-blue to-teal-500" />

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Administrator, <span className="text-primary-blue">{user?.name}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">System monitoring dashboard. Oversee regional distributor registrations and wallet balances</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-wider uppercase bg-primary-blue/10 border border-primary-blue/20 text-primary-blue px-3 py-1 rounded-full flex items-center gap-1.5">
            <Shield size={10} />
            <span>{user?.role}</span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1 rounded-full">
            {user?.status}
          </span>
        </div>
      </div>

      {/* Database Statistics Summary Panel */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">User Registries Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Users */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Total Partners (Users)</span>
              <Users size={16} className="text-slate-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white tracking-tight">
                {summary?.totalUsers || 0}
              </span>
            </div>
          </div>

          {/* Total Retailers */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28 hover:border-primary-blue/25 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Retailers Network</span>
              <Briefcase size={16} className="text-primary-blue/70" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {summary?.totalRetailers || 0}
              </span>
            </div>
          </div>

          {/* Total Distributors */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28 hover:border-indigo-500/25 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Distributors Network</span>
              <Layers size={16} className="text-indigo-400/70" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {summary?.totalDistributors || 0}
              </span>
            </div>
          </div>

          {/* Total Master Distributors */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28 hover:border-teal-500/25 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Master Distributors</span>
              <Award size={16} className="text-teal-400/70" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {summary?.totalMasterDistributors || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Kiosk Order Summary Panel */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">Kiosk Orders Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Orders */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">System Kiosk Orders</span>
              <ShoppingBag size={16} className="text-slate-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {summary?.totalOrders || 0}
              </span>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28 hover:border-amber-500/25 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Pending Verification</span>
              <Clock size={16} className="text-amber-500/80" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-amber-500 tracking-tight">
                {summary?.pendingOrders || 0}
              </span>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28 hover:border-emerald-500/25 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Completed Orders</span>
              <CheckCircle size={16} className="text-emerald-400/80" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                {summary?.completedOrders || 0}
              </span>
            </div>
          </div>

          {/* Rejected Orders */}
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-28 hover:border-red-500/25 transition-colors">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">Rejected Orders</span>
              <XCircle size={16} className="text-red-400/80" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-red-400 tracking-tight">
                {summary?.rejectedOrders || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Shortcuts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">System Management Panels</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 1: User Management */}
          <div className="group p-5 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 select-none">
            <div>
              <Users2 size={20} className="text-primary-blue mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-bold text-slate-100">User Management</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-normal">Audit partner registrations, PAN details, state/district locations.</p>
            </div>
            <span className="text-[8px] font-bold text-primary-blue/70 bg-primary-blue/5 border border-primary-blue/10 px-2 py-0.5 rounded-full w-max mt-2">
              Coming Soon
            </span>
          </div>

          {/* Card 2: Service Management */}
          <div className="group p-5 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 select-none">
            <div>
              <Settings size={20} className="text-indigo-400 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-bold text-slate-100">Service Config</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-normal">Configure Samagra, PAN find, and voter lookup APIs.</p>
            </div>
            <span className="text-[8px] font-bold text-indigo-400/70 bg-indigo-50/5 border border-indigo-500/10 px-2 py-0.5 rounded-full w-max mt-2">
              Coming Soon
            </span>
          </div>

          {/* Card 3: Order Management */}
          <div className="group p-5 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 select-none">
            <div>
              <ShoppingBag size={20} className="text-teal-400 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-bold text-slate-100">Kiosk Orders</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-normal">Audit, verify, complete, or reject partner service logs.</p>
            </div>
            <span className="text-[8px] font-bold text-teal-400/70 bg-teal-50/5 border border-teal-500/10 px-2 py-0.5 rounded-full w-max mt-2">
              Coming Soon
            </span>
          </div>

          {/* Card 4: Wallet & Settlements */}
          <div className="group p-5 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 select-none">
            <div>
              <Wallet size={20} className="text-amber-500 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-bold text-slate-100">Wallet & Payments</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-normal">Oversee merchant deposits, balances, and ledger settlements.</p>
            </div>
            <span className="text-[8px] font-bold text-amber-400/70 bg-amber-50/5 border border-amber-500/10 px-2 py-0.5 rounded-full w-max mt-2">
              Coming Soon
            </span>
          </div>

          {/* Card 5: System Reports */}
          <div className="group p-5 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-36 transition-all duration-200 select-none">
            <div>
              <FileSpreadsheet size={20} className="text-emerald-400 mb-3 group-hover:scale-105 transition-transform duration-200" />
              <h4 className="text-xs font-bold text-slate-100">Reports Ledger</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-normal">Export audit logs, user counts, and transaction summaries.</p>
            </div>
            <span className="text-[8px] font-bold text-emerald-400/70 bg-emerald-50/5 border border-emerald-500/10 px-2 py-0.5 rounded-full w-max mt-2">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
