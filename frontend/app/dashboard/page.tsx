'use client';

import React from 'react';
import { useAuthStore } from '@/features/auth/authStore';
import { useUserDashboardSummary } from '@/features/dashboard/hooks/useUserDashboardSummary';
import {
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  Grid,
  History,
  LifeBuoy,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch, isFetching } = useUserDashboardSummary();

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse p-5"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 mb-4"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2 mb-2"></div>
              <div className="h-5 bg-slate-800 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Placeholders Grid Skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-slate-900 rounded w-1/6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-40 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"
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
          <h3 className="text-lg font-bold text-white">Failed to Load Summary</h3>
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

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const formattedUserType = user?.userType
    ? user.userType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Retailer';

  return (
    <div className="space-y-8">
      {/* Welcome & Info Banner */}
      <div className="relative p-6 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Banner highlight line */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary-blue to-teal-500" />
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Welcome back, <span className="text-primary-blue">{user?.name}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage single wallet balances and kiosk digital portal integrations</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-wider uppercase bg-primary-blue/10 border border-primary-blue/20 text-primary-blue px-3 py-1 rounded-full">
            {formattedUserType}
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{user?.status}</span>
          </span>
        </div>
      </div>

      {/* Main Aggregations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
        {/* Wallet Balance Card */}
        <div className="relative p-5 bg-gradient-to-tr from-slate-900 to-indigo-950/40 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col justify-between h-32 group overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-24 h-24 bg-primary-blue/5 rounded-full blur-xl group-hover:bg-primary-blue/10 transition-colors duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Wallet Balance</span>
            <div className="w-8 h-8 rounded-xl bg-primary-blue/10 flex items-center justify-center text-primary-blue">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-black text-white tracking-tight">
              {formatCurrency(summary?.walletBalance)}
            </span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-350">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-white tracking-tight">
              {summary?.totalOrders || 0}
            </span>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-32 hover:border-amber-500/20 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-amber-500 tracking-tight">
              {summary?.pendingOrders || 0}
            </span>
          </div>
        </div>

        {/* Completed Orders Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-32 hover:border-emerald-500/20 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Completed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-emerald-400 tracking-tight">
              {summary?.completedOrders || 0}
            </span>
          </div>
        </div>

        {/* Rejected Orders Card */}
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between h-32 hover:border-red-500/20 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Rejected Orders</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold text-red-400 tracking-tight">
              {summary?.rejectedOrders || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Services Directory */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">Kiosk Shortcuts</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Action 1: Add Wallet */}
          <div className="group p-6 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 select-none relative">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center text-primary-blue mb-4 group-hover:scale-105 transition-transform duration-200">
                <PlusCircle size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Add Wallet</h4>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">Deposit cash balances directly into your service wallet.</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-primary-blue/70 uppercase tracking-widest bg-primary-blue/5 border border-primary-blue/10 px-2 py-0.5 rounded-full scale-95 origin-left">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Action 2: Use Services */}
          <div className="group p-6 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 select-none relative">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform duration-200">
                <Grid size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Use Services</h4>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">Access government and fintech agency integration APIs.</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest bg-indigo-50/5 border border-indigo-500/10 px-2 py-0.5 rounded-full scale-95 origin-left">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Action 3: My Orders */}
          <div className="group p-6 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 select-none relative">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform duration-200">
                <History size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-100">My Orders</h4>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">Review historical client order statuses and reports.</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-teal-400/70 uppercase tracking-widest bg-teal-50/5 border border-teal-500/10 px-2 py-0.5 rounded-full scale-95 origin-left">
                Coming Soon
              </span>
            </div>
          </div>

          {/* Action 4: Support */}
          <div className="group p-6 bg-slate-900/35 border border-slate-800/85 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between h-40 transition-all duration-200 select-none relative">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform duration-200">
                <LifeBuoy size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Support Desk</h4>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">Raise tickets or connect to customer care support networks.</p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest bg-amber-50/5 border border-amber-500/10 px-2 py-0.5 rounded-full scale-95 origin-left">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
