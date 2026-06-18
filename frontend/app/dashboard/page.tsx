'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/authStore';
import { useUserDashboardSummary } from '@/features/dashboard/hooks/useUserDashboardSummary';
import { ServiceDiscovery } from '@/features/dashboard/components/ServiceDiscovery';
import {
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Grid,
  History,
  LifeBuoy,
  RefreshCw,
  AlertTriangle,
  IndianRupee,
  Megaphone,
  UserCheck,
  FileText,
  Upload,
  Search,
  Heart,
  Download,
  AlertCircle,
  TrendingUp,
  Percent,
} from 'lucide-react';

const QUICK_SERVICES = [
  { name: 'PAN Apply Ekyc / esgin', icon: UserCheck, badge: 'New', badgeColor: 'bg-rose-500 text-white', color: 'bg-blue-50 text-[#145BFF] border-blue-100', href: '/services' },
  { name: 'New PAN Apply', icon: FileText, badge: 'Smart', badgeColor: 'bg-orange-500 text-white', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', href: '/services' },
  { name: 'CSF PAN Apply', icon: FileText, badge: 'Smart', badgeColor: 'bg-orange-500 text-white', color: 'bg-amber-50 text-amber-600 border-amber-100', href: '/services' },
  { name: 'Upload PAN Form', icon: Upload, color: 'bg-purple-50 text-purple-600 border-purple-100', href: '/services' },
  { name: 'PAN History', icon: History, color: 'bg-slate-50 text-slate-600 border-slate-200', href: '/services' },
  { name: 'Find Lost PAN', icon: Search, color: 'bg-rose-50 text-rose-600 border-rose-100', href: '/services' },
  { name: 'PAN PDF', icon: FileText, color: 'bg-red-50 text-red-600 border-red-100', href: '/services' },
  { name: 'Voter PDF', icon: UserCheck, color: 'bg-teal-50 text-teal-600 border-teal-100', href: '/services' },
  { name: 'ABHA Create', icon: Heart, color: 'bg-green-50 text-green-600 border-green-100', href: '/services' },
  { name: 'ABHA Download', icon: Download, color: 'bg-sky-50 text-sky-600 border-sky-100', href: '/services' },
];

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch, isFetching } = useUserDashboardSummary();

  const handleRetry = () => {
    refetch();
  };

  const summary = data?.data;

  // Render skeleton loaders during initial fetch (updated to light theme)
  if (isLoading) {
    return (
      <div className="space-y-8 select-none">
        {/* Welcome Banner Skeleton */}
        <div className="h-28 bg-white border border-slate-200 rounded-3xl animate-pulse p-6 flex flex-col justify-between">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse p-5"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 mb-4"></div>
              <div className="h-4 bg-slate-150 rounded w-1/2"></div>
            </div>
          ))}
        </div>

        {/* Placeholders Grid Skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse"
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
      <div className="p-8 bg-red-50 border border-red-200 text-red-600 rounded-3xl flex flex-col items-center justify-center text-center gap-4 max-w-lg mx-auto mt-12 shadow-sm">
        <AlertTriangle size={40} className="text-red-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-800">Failed to Load Summary</h3>
          <p className="text-sm text-red-600/80 mt-1">
            {error instanceof Error ? error.message : 'A network error occurred while communicating with the server.'}
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md shadow-red-600/10"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <span>Retry Request</span>
        </button>
      </div>
    );
  }

  const formatCurrency = (val?: number, maximumFractionDigits = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits,
    }).format(val || 0);
  };

  const formattedUserType = user?.userType
    ? user.userType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Retailer';

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Info Banner */}
      <div className="relative p-6 bg-gradient-to-r from-[#0c1a30] via-[#112a52] to-[#145bff] rounded-3xl overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-lg">
        {/* Banner highlight line */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-[#f59e0b]" />
        
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Welcome back, <span className="text-[#f59e0b]">{user?.name}</span> 👋
          </h2>
          <p className="text-xs text-slate-300 font-medium">Helping Mitra Kiosk Digital Agency Dashboard</p>
        </div>

        {/* Glassmorphic Badges */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Wallet Balance widget */}
          <div className="px-4 py-2.5 bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl min-w-[150px] shadow-sm select-none">
            <p className="text-[9px] font-black tracking-wider uppercase text-blue-200">Wallet Balance</p>
            <p className="text-lg font-black text-white mt-0.5">{formatCurrency(summary?.walletBalance, 2)}</p>
          </div>

          {/* User Type widget */}
          <div className="px-4 py-2.5 bg-white/10 border border-white/10 backdrop-blur-md rounded-2xl min-w-[130px] shadow-sm select-none">
            <p className="text-[9px] font-black tracking-wider uppercase text-blue-200">User Type</p>
            <p className="text-sm font-bold text-white mt-1 uppercase tracking-wide">{formattedUserType}</p>
          </div>
        </div>
      </div>

      {/* Promotional Banner & Announcements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Promotional Card */}
        <div className="lg:col-span-2">
          <div className="relative p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 h-full min-h-[280px]">
            {/* Left Column: Text Content */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#145BFF]/10 text-[#145BFF] text-[10px] font-black uppercase tracking-wider rounded-md">
                  Official API Integration
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                  Protean & NSDL
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  One Stop Solution for <span className="text-[#145BFF]">PAN & More</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Fast, secure, reliable, and completely paperless digital agency services dashboard.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  <span>100% Secure & Trusted</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle size={14} className="text-[#145BFF] shrink-0" />
                  <span>Instant Processing</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle size={14} className="text-purple-500 shrink-0" />
                  <span>Paperless Documents</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle size={14} className="text-amber-500 shrink-0" />
                  <span>24/7 Agent Support</span>
                </div>
              </div>
            </div>
            
            {/* Right Column: Visual illustration block */}
            <div className="w-full md:w-56 shrink-0 relative bg-gradient-to-tr from-blue-50 to-indigo-50/40 rounded-xl p-4 border border-blue-100/40 flex flex-col justify-between h-44 shadow-inner">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#145BFF] flex items-center justify-center text-white text-xs font-black shadow-sm">
                  HM
                </div>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full uppercase">
                  Live Services
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-700">Available Digital Cards:</div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] font-semibold bg-white border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded">PAN Card</span>
                  <span className="text-[9px] font-semibold bg-white border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Voter PDF</span>
                  <span className="text-[9px] font-semibold bg-white border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded">DL Card</span>
                  <span className="text-[9px] font-semibold bg-white border border-slate-100 text-slate-600 px-1.5 py-0.5 rounded">ABHA Card</span>
                </div>
              </div>

              <div className="text-[9px] font-black text-slate-400 text-right">
                POWERED BY HELPING MITRA
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Announcements */}
        <div>
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 flex flex-col h-full min-h-[280px]">
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Megaphone size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Announcements</h3>
                <p className="text-[10px] text-slate-400">Latest news and alerts</p>
              </div>
            </div>
            
            <div className="flex-1 py-3 overflow-y-auto space-y-3 pr-1">
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/20 text-xs text-blue-700 font-medium leading-relaxed">
                Welcome to the upgraded <span className="font-bold">Helping Mitra Dashboard</span>! We have aligned our workspace design to offer you the best-in-class agency experience.
              </div>
              
              <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/20 text-xs text-emerald-700 font-medium leading-relaxed">
                ✅ Aadhaar to PAN, NSDL e-KYC, Voter ID download, and ABHA Health Card creation are fully functional.
              </div>
              
              <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100/20 text-xs text-rose-700 font-medium leading-relaxed">
                ⚠️ Notice: Please do not share your password, OTP, or PIN code with anyone. Helping Mitra staff will never ask for them.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Services */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800">Quick Services</h3>
          <span className="text-xs font-semibold text-slate-400">Most used services</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {QUICK_SERVICES.map((serv, index) => {
            const Icon = serv.icon;
            return (
              <Link
                key={index}
                href={serv.href}
                className="group relative bg-white border border-slate-200 hover:border-blue-400/80 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-all duration-200 hover:shadow-md hover:shadow-slate-100 select-none cursor-pointer hover:-translate-y-0.5"
              >
                {/* Badge if present */}
                {serv.badge && (
                  <span className={`absolute top-2.5 right-2.5 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${serv.badgeColor} scale-90`}>
                    {serv.badge}
                  </span>
                )}

                {/* Circle Icon wrapper */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform duration-200 ${serv.color}`}>
                  <Icon size={18} />
                </div>

                <span className="text-xs font-bold text-slate-700 leading-tight group-hover:text-slate-900">
                  {serv.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* PAN Module Overview */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-800">PAN Module Overview</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Pending Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{summary?.pendingOrders || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pending</p>
            </div>
          </div>

          {/* Upload Pending Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <Upload size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">0</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Upload Pending</p>
            </div>
          </div>

          {/* Observation Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">0</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Observation</p>
            </div>
          </div>

          {/* Success Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-emerald-600 leading-none">{summary?.completedOrders || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Success</p>
            </div>
          </div>

          {/* Rejected Card */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <XCircle size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-red-500 leading-none">{summary?.rejectedOrders || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Rejected</p>
            </div>
          </div>

          {/* Today Pan Sale */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{formatCurrency(0)}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Today Pan Sale</p>
            </div>
          </div>

          {/* Monthly Pan Sale */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 leading-none">{formatCurrency(1070)}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Monthly Pan Sale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Overview */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-800">Business Overview</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Today Commission */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <IndianRupee size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{formatCurrency(0, 2)}</p>
              <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wide">Today Commission</p>
            </div>
          </div>

          {/* Monthly Commission */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <IndianRupee size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">{formatCurrency(0, 2)}</p>
              <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wide">Monthly Commission</p>
            </div>
          </div>

          {/* Today New Pan */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">0</p>
              <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wide">Today New Pan</p>
            </div>
          </div>

          {/* Today CSF Pan */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <Percent size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 leading-none">0</p>
              <p className="text-xs font-bold text-slate-400 mt-1.5 uppercase tracking-wide">Today CSF Pan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Services */}
      <React.Suspense fallback={<div className="h-56 bg-white border border-gray-150 rounded-3xl animate-pulse" />}>
        <ServiceDiscovery />
      </React.Suspense>
    </div>
  );
}
