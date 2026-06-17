'use client';

import React, { useEffect, useState } from 'react';
import { useAppHealth, useDbHealth } from '@/features/health/health.hooks';
import { 
  Activity, 
  Database, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Coins
} from 'lucide-react';

export default function Home() {
  const { 
    data: appData, 
    error: appError, 
    isLoading: isAppLoading, 
    isFetching: isAppFetching,
    refetch: refetchApp 
  } = useAppHealth();

  const { 
    data: dbData, 
    error: dbError, 
    isLoading: isDbLoading, 
    isFetching: isDbFetching,
    refetch: refetchDb 
  } = useDbHealth();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerManualRefetch = () => {
    refetchApp();
    refetchDb();
  };

  const isAnyFetching = isAppFetching || isDbFetching;

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />

      {/* Main Header / Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 p-2 shadow-lg shadow-teal-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-teal-400 bg-clip-text text-transparent">
              Helping Mitra
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Phase 0 Foundation
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Panel */}
      <main className="mx-auto max-w-7xl px-6 py-12 flex-grow w-full flex flex-col justify-center">
        
        {/* Intro */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white mb-6">
            Technical Foundation <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-400 via-teal-200 to-indigo-400 bg-clip-text text-transparent">
              Live Health Status
            </span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl leading-relaxed">
            Helping Mitra backend and database orchestration panel. Monitor connection states, api endpoints, and system operations in real time.
          </p>
        </div>

        {/* Status Grid Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto w-full mb-12">
          
          {/* Card 1: Frontend Status */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 backdrop-blur-md flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-slate-700/80 hover:shadow-2xl hover:shadow-slate-900/50">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Activity className="h-28 w-28 text-white" />
            </div>
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">Frontend Status</h3>
              <p className="text-sm text-slate-500">Next.js Client app context</p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-2xl font-bold text-white">Running</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Card 2: Backend Status */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 backdrop-blur-md flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-slate-700/80 hover:shadow-2xl hover:shadow-slate-900/50">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Server className="h-28 w-28 text-white" />
            </div>
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Server className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">Backend API</h3>
              <p className="text-sm text-slate-500">Node/Express endpoint connectivity</p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              {isAppLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-lg font-medium">Connecting...</span>
                </div>
              ) : appError ? (
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-lg font-bold">Failed</span>
                </div>
              ) : appData?.success ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-lg font-bold">Connected</span>
                </div>
              ) : (
                <span className="text-slate-500">Unknown</span>
              )}

              {appData?.success && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Database Status */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 backdrop-blur-md flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-slate-700/80 hover:shadow-2xl hover:shadow-slate-900/50">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Database className="h-28 w-28 text-white" />
            </div>
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">PostgreSQL DB</h3>
              <p className="text-sm text-slate-500">NeonDB downstream connectivity</p>
            </div>
            <div className="mt-8 flex items-center justify-between">
              {isDbLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-lg font-medium">Connecting...</span>
                </div>
              ) : dbError ? (
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-lg font-bold">Failed</span>
                </div>
              ) : dbData?.success ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-lg font-bold">Connected</span>
                </div>
              ) : (
                <span className="text-slate-500">Unknown</span>
              )}

              {dbData?.success && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Diagnostics & Refetch Actions */}
        <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/25 border border-slate-900 rounded-2xl px-6 py-4 backdrop-blur-sm mb-16">
          <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">API Gateway URL</span>
            <code className="text-sm text-slate-300 bg-slate-950/50 border border-slate-900 px-3 py-1 rounded-lg">
              {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}
            </code>
          </div>

          <button
            onClick={triggerManualRefetch}
            disabled={isAnyFetching}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 px-5 py-2.5 text-sm font-semibold text-teal-400 hover:bg-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isAnyFetching ? 'animate-spin' : ''}`} />
            {isAnyFetching ? 'Syncing...' : 'Refetch Status'}
          </button>
        </div>

        {/* Monolith Architecture Roadmap Placeholder */}
        <div className="max-w-5xl mx-auto w-full">
          <div className="border-t border-slate-900 pt-12">
            <h2 className="text-xl font-bold tracking-tight text-white mb-8 text-center sm:text-left">
              Modular Monolith Structure & Scaling Roadmap
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Card A */}
              <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-2xl">
                <div className="mb-4 text-teal-400">
                  <Coins className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-200 mb-2">Ledger & Wallet Ledger</h4>
                <p className="text-sm text-slate-400">
                  Future wallet increments will implement ledger accounting transactions logs keeping audit tracks of every credit/debit.
                </p>
              </div>

              {/* Card B */}
              <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-2xl">
                <div className="mb-4 text-indigo-400">
                  <Shield className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-200 mb-2">Idempotent Requests</h4>
                <p className="text-sm text-slate-400">
                  All payment, charges and status changes APIs will require an Idempotency-Key header verified by caches to avoid double charges.
                </p>
              </div>

              {/* Card C */}
              <div className="p-6 bg-slate-950/40 border border-slate-900 rounded-2xl">
                <div className="mb-4 text-teal-400">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-slate-200 mb-2">Strict Transaction IDs</h4>
                <p className="text-sm text-slate-400">
                  Transactions and refunds will generate prefixed ULIDs (e.g. `txn_` and `ref_`) to prevent information leakage and listing hacks.
                </p>
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/50 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            &copy; 2026 {process.env.NEXT_PUBLIC_APP_NAME || 'Helping Mitra'}. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 mt-2 sm:mt-0 flex items-center justify-center gap-1.5">
            Designed for scaling. Built with Clean Code standards.
          </p>
        </div>
      </footer>

    </div>
  );
}
