'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/authStore';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { useCategories } from '@/features/services/hooks/useCategories';
import { useServices } from '@/features/services/hooks/useServices';
import { ServiceListItem, ResultType } from '@/features/services/types';
import {
  Search,
  X,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  FileText,
  Upload,
  CheckCircle,
  AlignLeft,
  LayoutGrid,
  Layers,
  Star,
} from 'lucide-react';

/* ─── Gradient palette for service icons ─── */
const ICON_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-teal-500 to-cyan-600',
  'from-sky-500 to-blue-600',
  'from-purple-500 to-indigo-600',
  'from-green-500 to-emerald-600',
];

/* ─── Result type badge config ─── */
const RESULT_CONFIG: Record<ResultType, { label: string; color: string }> = {
  FILE_UPLOAD: { label: 'File Result', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  STATUS_ONLY: { label: 'Status Result', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TEXT_RESULT: { label: 'Text Result', color: 'bg-violet-50 text-violet-700 border-violet-200' },
};

function ResultIcon({ type }: { type: ResultType }) {
  if (type === 'FILE_UPLOAD') return <Upload size={10} />;
  if (type === 'STATUS_ONLY') return <CheckCircle size={10} />;
  return <AlignLeft size={10} />;
}

function ServiceIcon({ index }: { index: number }) {
  const icons = [FileText, Upload, CheckCircle, AlignLeft, LayoutGrid, Star, Layers];
  const Icon = icons[index % icons.length];
  return <Icon size={20} strokeWidth={2} />;
}

/* ──────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────── */
export default function ServicesCataloguePage() {
  const { status, user } = useAuthStore();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 9;

  /* ── Redirect users based on auth status ── */
  useEffect(() => {
    if (status === 'loading' || status === 'idle') return;

    if (status === 'authenticated') {
      if (user?.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, user, router]);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Data fetching ── */
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const {
    data: servicesData,
    isLoading: svcLoading,
    isError: svcError,
    refetch,
  } = useServices({ page, limit, category: category || undefined, search: debouncedSearch || undefined });

  const handleCategorySelect = (slug: string) => {
    setCategory(slug);
    setSearch('');
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setPage(1);
  };

  if (status === 'loading' || status === 'idle' || status === 'authenticated' || status === 'unauthenticated') return null;

  const totalPages = servicesData?.pagination.totalPages ?? 1;
  const totalCount = servicesData?.pagination.total ?? 0;
  const services = servicesData?.services ?? [];
  const hasFilters = !!(search || category);

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      {/* ── Ambient Glow Blobs ── */}
      <div className="pointer-events-none fixed top-[-10%] left-[-15%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none fixed top-[40%] right-[-15%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />

      <PublicHeader />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">

        {/* ══ Page Header ══ */}
        <div className="text-center mb-10">
          {/* Super label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm mb-5">
            <Layers size={13} className="text-primary-blue" />
            Helping Mitra Digital Services
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Explore{' '}
            <span className="relative text-primary-blue">
              Services
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-30 translate-y-1" />
            </span>
          </h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto font-medium">
            Choose the service you need — fast, secure, and completely paperless digital government services.
          </p>
        </div>

        {/* ══ Search Bar ══ */}
        <div className="relative max-w-2xl mx-auto mb-7">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            id="services-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services (e.g. PAN, Voter, Samagra, ABHA)…"
            className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/10 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm text-sm"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ══ Category Filter Tabs ══ */}
        {!catLoading && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-8 scrollbar-none justify-start sm:justify-center flex-nowrap">
            <button
              id="filter-all"
              onClick={() => handleCategorySelect('')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-all duration-200 shrink-0 ${
                category === ''
                  ? 'bg-primary-blue text-white border-primary-blue shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              All Services
            </button>

            {categories.map((cat) => (
              <button
                id={`filter-${cat.slug}`}
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap border transition-all duration-200 shrink-0 ${
                  category === cat.slug
                    ? 'bg-primary-blue text-white border-primary-blue shadow-md shadow-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ══ Results Count Row ══ */}
        {!svcLoading && !svcError && services.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500 font-medium">
              Showing{' '}
              <span className="font-bold text-slate-800">{services.length}</span>{' '}
              of{' '}
              <span className="font-bold text-slate-800">{totalCount}</span>{' '}
              services
              {category && categories.find((c) => c.slug === category) && (
                <span>
                  {' '}in{' '}
                  <span className="font-bold text-primary-blue">
                    {categories.find((c) => c.slug === category)?.name}
                  </span>
                </span>
              )}
            </p>

            {hasFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <X size={13} />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ══ States ══ */}
        {svcLoading || catLoading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse flex flex-col justify-between h-64 shadow-sm"
              >
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 pt-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-full mt-1" />
                  <div className="h-3 bg-slate-100 rounded w-5/6 mt-1.5" />
                </div>
                <div className="space-y-2.5 pt-4 border-t border-slate-100 mt-3">
                  <div className="flex justify-between">
                    <div className="h-6 bg-slate-100 rounded w-14" />
                    <div className="h-4 bg-slate-100 rounded w-20" />
                  </div>
                  <div className="h-9 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : svcError ? (
          /* Error State */
          <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center max-w-md mx-auto shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Network Error</h3>
            <p className="text-sm text-red-600 mb-6">
              Could not load services from the server. Please check your connection.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm shadow-md shadow-red-300"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        ) : services.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="h-7 w-7 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Services Found</h3>
            <p className="text-sm text-slate-500 mb-6">
              {hasFilters
                ? 'Try clearing your filters or search with different keywords.'
                : 'No services are currently available in this category.'}
            </p>
            {hasFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ══ Services Grid ══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {services.map((service: ServiceListItem, index: number) => {
                const gradient = ICON_GRADIENTS[index % ICON_GRADIENTS.length];
                const resultCfg = RESULT_CONFIG[service.resultType] ?? {
                  label: service.resultType,
                  color: 'bg-slate-50 text-slate-700 border-slate-200',
                };
                const fieldsCount = service._count?.fields ?? 0;
                const docsCount = service._count?.documentRequirements ?? 0;

                return (
                  <div
                    key={service.id}
                    className="group relative bg-white rounded-2xl border border-slate-100 hover:border-primary-blue/25 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-slate-100/80 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div>
                      {/* Header: Icon + Name + Category */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Blue Gradient Icon */}
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0 shadow-md`}
                        >
                          <ServiceIcon index={index} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-semibold text-primary-blue bg-blue-50 px-2.5 py-0.5 rounded-md inline-block mb-1.5 leading-none">
                            {service.category.name}
                          </span>
                          <h3 className="text-base font-bold text-slate-800 group-hover:text-primary-blue transition-colors leading-tight truncate">
                            {service.name}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                        {service.shortDescription ||
                          service.description ||
                          'Fast, secure, and completely paperless digital service for citizens.'}
                      </p>

                      {/* Meta Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2.5 py-1 rounded-full ${resultCfg.color}`}
                        >
                          <ResultIcon type={service.resultType} />
                          {resultCfg.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                          <FileText size={10} />
                          {fieldsCount} {fieldsCount === 1 ? 'Detail Required' : 'Details Required'}
                        </span>
                        {docsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                            <Upload size={10} />
                            {docsCount} {docsCount === 1 ? 'Document' : 'Documents'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3.5">
                      {/* MRP + View Details */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Our Fee
                          </span>
                          <span className="text-xl font-black text-slate-800 flex items-center gap-0.5 mt-0.5 leading-none">
                            <IndianRupee size={14} strokeWidth={2.5} />
                            {service.mrp}
                          </span>
                        </div>

                        <Link
                          href={`/services/${service.slug}`}
                          className="inline-flex items-center gap-1 text-sm font-bold text-primary-blue hover:text-blue-700 transition-colors group/btn"
                        >
                          View Details
                          <ArrowRight
                            size={14}
                            className="group-hover/btn:translate-x-0.5 transition-transform"
                          />
                        </Link>
                      </div>

                      {/* Login to Continue — public page is only shown to unauthenticated users */}
                      <Link
                        href={`/login?redirect=/services/${service.slug}`}
                        id={`login-btn-${service.slug}`}
                        className="w-full py-3 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md shadow-blue-100"
                      >
                        Login to Continue
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ══ Pagination ══ */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-500">
                  Page{' '}
                  <span className="font-bold text-slate-800">{page}</span>
                  {' '}of{' '}
                  <span className="font-bold text-slate-800">{totalPages}</span>
                  {' '}·{' '}
                  <span className="font-medium">{totalCount} total services</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
