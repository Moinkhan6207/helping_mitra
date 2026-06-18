'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCategories } from '@/features/services/hooks/useCategories';
import { useServices } from '@/features/services/hooks/useServices';
import { ServiceListItem, ResultType } from '@/features/services/types';
import {
  Search,
  ArrowRight,
  X,
  Sparkles,
  IndianRupee,
  FileText,
  Upload,
  CheckCircle,
  AlignLeft,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';

/* ─── Gradient icon backgrounds per category index ─── */
const ICON_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-teal-500 to-cyan-600',
];

/* ─── Result type configs ─── */
const RESULT_CONFIG: Record<ResultType, { label: string; color: string }> = {
  FILE_UPLOAD: { label: 'File Result', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  STATUS_ONLY: { label: 'Status Result', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TEXT_RESULT: { label: 'Text Result', color: 'bg-violet-50 text-violet-700 border-violet-200' },
};

/* ─── Result type icon ─── */
function ResultIcon({ type }: { type: ResultType }) {
  if (type === 'FILE_UPLOAD') return <Upload size={10} />;
  if (type === 'STATUS_ONLY') return <CheckCircle size={10} />;
  return <AlignLeft size={10} />;
}

/* ─── Service icon by index ─── */
function ServiceIcon({ index }: { index: number }) {
  const icons = [FileText, Upload, CheckCircle, AlignLeft, LayoutGrid, Sparkles];
  const Icon = icons[index % icons.length];
  return <Icon size={20} strokeWidth={2} />;
}

/* ══════════════════════════════════════════════════════════════ */
export const ServiceDiscovery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [comingSoonService, setComingSoonService] = useState<ServiceListItem | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get('category') || '';

  // Synchronize state when URL category param changes
  useEffect(() => {
    setActiveCategory(catParam);
  }, [catParam]);

  /* ── Debounce ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ── Data ── */
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: servicesData, isLoading: svcLoading } = useServices({
    page: 1,
    limit: 8,
    category: activeCategory || undefined,
    search: debouncedSearch || undefined,
  });

  const services = servicesData?.services ?? [];
  const hasFilters = !!(searchTerm || activeCategory);

  const handleCategorySelect = (slug: string) => {
    setSearchTerm('');
    setActiveCategory(slug);
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (slug) {
        params.set('category', slug);
      } else {
        params.delete('category');
      }
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  };

  const clearAll = () => {
    setSearchTerm('');
    setActiveCategory('');
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('category');
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  };

  /* ────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Available Services
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Browse and explore all digital services offered through Helping Mitra.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-blue hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-all border border-blue-100 shrink-0"
        >
          View All Services
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          id="service-discovery-search"
          type="text"
          placeholder="Search services… e.g. PAN, Voter, Samagra"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/10 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Category Chips ── */}
      {catLoading ? (
        <div className="flex gap-2 overflow-x-auto pb-1 select-none animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-full shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none flex-nowrap">
          <button
            id="category-chip-all"
            onClick={() => handleCategorySelect('')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all border shrink-0 ${
              activeCategory === ''
                ? 'bg-primary-blue text-white border-primary-blue shadow-sm shadow-blue-100'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            All Services
          </button>

          {categories.map((cat) => (
            <button
              id={`category-chip-${cat.slug}`}
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all border shrink-0 ${
                activeCategory === cat.slug
                  ? 'bg-primary-blue text-white border-primary-blue shadow-sm shadow-blue-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Service Cards Grid ── */}
      {svcLoading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse flex flex-col justify-between h-56"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-full mt-2" />
                <div className="h-3 bg-slate-100 rounded w-5/6 mt-1.5" />
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-100 mt-3">
                <div className="flex justify-between">
                  <div className="h-5 bg-slate-100 rounded w-14" />
                  <div className="h-4 bg-slate-100 rounded w-20" />
                </div>
                <div className="h-8 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
            <LayoutGrid size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-700">No services found</p>
          <p className="text-xs text-slate-400 mt-1">
            {hasFilters
              ? 'Try resetting your search or switching categories.'
              : 'No services are currently available.'}
          </p>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="mt-4 px-4 py-2 bg-primary-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results indicator */}
          <div className="flex items-center justify-between -mt-1">
            <p className="text-xs text-slate-400 font-semibold">
              Showing{' '}
              <span className="text-slate-700">{services.length}</span>{' '}
              popular service{services.length !== 1 ? 's' : ''}
              {activeCategory &&
                categories.find((c) => c.slug === activeCategory) && (
                  <span>
                    {' '}
                    in{' '}
                    <span className="text-primary-blue">
                      {categories.find((c) => c.slug === activeCategory)?.name}
                    </span>
                  </span>
                )}
              {searchTerm && (
                <span>
                  {' '}
                  matching "<span className="text-slate-700">{searchTerm}</span>"
                </span>
              )}
            </p>

            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                  className="group relative bg-white border border-slate-100 hover:border-primary-blue/25 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-slate-100/70 hover:-translate-y-0.5"
                >
                  <div>
                    {/* Icon + Name Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Blue Gradient Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0 shadow-sm`}
                      >
                        <ServiceIcon index={index} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-primary-blue transition-colors truncate">
                          {service.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {service.category.name}
                        </p>
                      </div>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {service.shortDescription ||
                        service.description ||
                        'Digital government service available for all citizens.'}
                    </p>

                    {/* Meta Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold border px-2 py-0.5 rounded-full ${resultCfg.color}`}
                      >
                        <ResultIcon type={service.resultType} />
                        {resultCfg.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        <FileText size={9} />
                        {fieldsCount} {fieldsCount === 1 ? 'Detail' : 'Details'}
                      </span>
                      {docsCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          <Upload size={9} />
                          {docsCount} {docsCount === 1 ? 'Doc' : 'Docs'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    {/* Price + View Details */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Our Fee
                        </p>
                        <p className="text-base font-black text-slate-800 flex items-center gap-0.5 leading-none mt-0.5">
                          <IndianRupee size={12} strokeWidth={2.5} />
                          {service.mrp}
                        </p>
                      </div>
                      <Link
                        href={`/services/${service.slug}`}
                        className="inline-flex items-center gap-0.5 text-xs font-bold text-primary-blue hover:text-blue-700 transition-colors"
                      >
                        View Details
                        <ArrowRight
                          size={12}
                          className="group-hover:translate-x-0.5 transition-transform duration-200"
                        />
                      </Link>
                    </div>

                    {/* Apply / Use Service Button */}
                    <button
                      id={`apply-service-${service.slug}`}
                      onClick={() => setComingSoonService(service)}
                      className="w-full py-2.5 bg-primary-blue hover:bg-secondary-blue active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-100 hover:shadow-blue-200 flex items-center justify-center gap-1.5"
                    >
                      Apply / Use Service
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Button */}
          <div className="flex justify-center pt-2">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-primary-blue/40 text-slate-700 hover:text-primary-blue rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md group"
            >
              <LayoutGrid size={16} />
              View All Services
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform duration-200"
              />
            </Link>
          </div>
        </>
      )}

      {/* ── Coming Soon Modal ── */}
      {comingSoonService && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setComingSoonService(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setComingSoonService(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
              <Sparkles size={28} className="text-white" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-primary-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-3">
              Phase 3 Feature
            </span>

            <h4 className="text-lg font-extrabold text-slate-800 mb-2">
              Kiosk Gateway Coming Soon
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-2">
              The application form and payment flow for{' '}
              <strong className="text-slate-700">{comingSoonService.name}</strong> are currently
              under development.
            </p>
            <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl w-full mb-5">
              Full order processing will launch in Phase 3 of Helping Mitra.
            </p>

            <p className="text-xs text-slate-500 mb-5">
              Meanwhile, you can{' '}
              <Link
                href={`/services/${comingSoonService.slug}`}
                className="text-primary-blue font-bold underline hover:text-blue-700"
              >
                view full service details
              </Link>
              .
            </p>

            <button
              onClick={() => setComingSoonService(null)}
              className="w-full py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDiscovery;
