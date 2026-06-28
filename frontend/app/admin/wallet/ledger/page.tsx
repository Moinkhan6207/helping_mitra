'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  X,
  User,
  Filter,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { useAdminWalletLedger, AdminWalletLedgerItem } from '@/features/wallet/rechargeApi';

// Currency Formatter helper
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

// Date formatting helper matching: "19-Jun-2026 08:28:01 PM"
const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
};

export default function AdminLedgerPage() {
  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // API query parameters state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
  });

  // Table local search (filter client-side within pages or trigger reload)
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Sorting local states (since server is chronological by default, let's keep simple client sorting or default)
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, isError, refetch, isFetching } = useAdminWalletLedger(filters);

  // Sync search input with debounce or search button click
  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: searchKeyword,
      status: statusFilter === 'Select' ? '' : statusFilter,
      type: typeFilter === 'Select' ? '' : typeFilter,
      dateFrom,
      dateTo,
    }));
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setTypeFilter('');
    setSearchKeyword('');
    setTableSearchQuery('');
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleRefresh = () => {
    refetch();
  };

  // Local sorting
  const sortedLedgers = useMemo(() => {
    if (!data?.ledgers) return [];
    const result = [...data.ledgers];

    // Filter using local table search query if present
    const filtered = result.filter((item) => {
      if (!tableSearchQuery) return true;
      const query = tableSearchQuery.toLowerCase();
      return (
        item.userName.toLowerCase().includes(query) ||
        item.userMobile.includes(query) ||
        item.referenceId.toLowerCase().includes(query) ||
        item.remarks.toLowerCase().includes(query)
      );
    });

    filtered.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (['amount', 'balanceBefore', 'balanceAfter'].includes(sortField)) {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      if (sortField === 'createdAt') {
        const t1 = new Date(aVal).getTime();
        const t2 = new Date(bVal).getTime();
        return sortDirection === 'asc' ? t1 - t2 : t2 - t1;
      }

      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data?.ledgers, sortField, sortDirection, tableSearchQuery]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1.5 inline text-slate-400 opacity-60" />;
    return (
      <span className="ml-1.5 text-[#145BFF] inline font-black">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const isFilterActive = 
    filters.search !== '' ||
    filters.status !== '' ||
    filters.type !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    tableSearchQuery !== '';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-white flex items-center gap-3">
            <BookOpen className="text-[#145BFF]" size={28} />
            Wallet Ledger Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Monitor and audit all partner wallet transactions including service debits, manual adjustments, recharges, and refunds.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-xs transition active:scale-[0.98]"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh Ledger
        </button>
      </div>

      {/* Main Ledger Component */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
        
        {/* Coral Orange Header Bar */}
        <div className="bg-[#eb5757] text-white px-6 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-white" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider">Walletledger</h2>
          </div>
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition border border-white/10 text-white active:scale-[0.97]"
            >
              <X size={12} />
              Clear Filters
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          
          {/* Advanced Query Filter Form */}
          <form onSubmit={handleFilterSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-slate-50/50 border border-slate-150 p-5 rounded-2xl dark:bg-slate-800/40 dark:border-slate-750">
            
            {/* From Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" />
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#eb5757] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            {/* To Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" />
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#eb5757] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            {/* Type Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#eb5757] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="">Select Type</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
                <option value="REFUND">Refund</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Global Search
              </label>
              <input
                type="text"
                placeholder="Name, mobile, or reference ID..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#eb5757] focus:border-transparent transition dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-[0.98] focus:outline-none cursor-pointer"
              >
                Search Ledger
              </button>
            </div>

          </form>

          {/* Table Header Configuration controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            
            {/* Show Entries selector */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold select-none">
              <span>Show</span>
              <select
                value={filters.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#eb5757] text-xs font-bold text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Live Filter query inside page */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Quick filter on page..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-750 placeholder:text-slate-400 focus:ring-1 focus:ring-[#eb5757] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
              {tableSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTableSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>

          </div>

          {/* Ledger Table Container */}
          <div className="overflow-x-auto border border-slate-150 rounded-2xl dark:border-slate-800/80">
            {isError ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-rose-500">
                <AlertCircle size={36} className="mb-3 text-rose-500" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Failed to Load Wallet Ledger</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">There was an error communicating with the database. Please try again.</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            ) : isLoading ? (
              <div className="p-8 space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse dark:bg-slate-800" />
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 bg-slate-50 border border-slate-100 rounded animate-pulse dark:bg-slate-800/50 dark:border-slate-750" />
                  ))}
                </div>
              </div>
            ) : sortedLedgers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <Inbox size={40} className="text-slate-300 mb-3" />
                <h4 className="font-bold text-xs text-slate-800 dark:text-white">No Matching Ledger Entries</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 font-semibold">
                  There are no ledger entries matching the applied filters and search parameters.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-500 font-bold select-none dark:bg-slate-800/40 dark:border-slate-750">
                    <th className="px-4 py-3">User Details</th>
                    <th className="px-4 py-3">User Type</th>
                    <th onClick={() => handleSort('type')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition dark:hover:bg-slate-800/50">
                      Type {renderSortIndicator('type')}
                    </th>
                    <th onClick={() => handleSort('amount')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition dark:hover:bg-slate-800/50">
                      Amount {renderSortIndicator('amount')}
                    </th>
                    <th onClick={() => handleSort('balanceBefore')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition dark:hover:bg-slate-800/50">
                      Opening {renderSortIndicator('balanceBefore')}
                    </th>
                    <th onClick={() => handleSort('amount')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition dark:hover:bg-slate-800/50">
                      Cr/Dr {renderSortIndicator('amount')}
                    </th>
                    <th onClick={() => handleSort('balanceAfter')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition dark:hover:bg-slate-800/50">
                      Closing {renderSortIndicator('balanceAfter')}
                    </th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Ref Type</th>
                    <th className="px-4 py-3">Reference ID</th>
                    <th onClick={() => handleSort('createdAt')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition dark:hover:bg-slate-800/50">
                      Date Time {renderSortIndicator('createdAt')}
                    </th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800/60 dark:text-slate-350">
                  {sortedLedgers.map((item: AdminWalletLedgerItem) => {
                    const isDebit = item.type === 'DEBIT';
                    const isRefund = item.type === 'REFUND';
                    const isAdjustment = item.type === 'ADJUSTMENT';
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-55/40 transition dark:hover:bg-slate-800/20">
                        
                        {/* User Details */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 dark:text-white block">{item.userName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono block">{item.userMobile}</span>
                          </div>
                        </td>

                        {/* User Type */}
                        <td className="px-4 py-3.5 uppercase text-[9px] font-bold text-slate-500 tracking-wider">
                          {item.userType?.replace(/_/g, ' ') || 'Admin'}
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isDebit 
                              ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/25 dark:text-rose-400' 
                              : isRefund
                              ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/25 dark:text-blue-400'
                              : isAdjustment
                              ? 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-400'
                              : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-400'
                          }`}>
                            {item.type}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className={`px-4 py-3.5 font-bold tabular-nums ${isDebit ? 'text-rose-600 dark:text-rose-450' : 'text-emerald-600 dark:text-emerald-450'}`}>
                          {isDebit ? '-' : '+'} {formatCurrency(item.amount)}
                        </td>

                        {/* Opening */}
                        <td className="px-4 py-3.5 tabular-nums text-slate-500 dark:text-slate-450">
                          {formatCurrency(item.balanceBefore)}
                        </td>

                        {/* Cr/Dr amount */}
                        <td className="px-4 py-3.5 tabular-nums text-slate-500 dark:text-slate-450">
                          {formatCurrency(item.amount)}
                        </td>

                        {/* Closing */}
                        <td className="px-4 py-3.5 font-extrabold text-slate-800 dark:text-white tabular-nums">
                          {formatCurrency(item.balanceAfter)}
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3.5 max-w-xs truncate text-slate-550 dark:text-slate-400" title={item.remarks}>
                          {item.remarks}
                        </td>

                        {/* Reference Type */}
                        <td className="px-4 py-3.5 font-bold text-[10px] tracking-wide text-indigo-500 uppercase">
                          {item.referenceType}
                        </td>

                        {/* Reference ID */}
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[10px] dark:text-slate-400">
                          {item.referenceId}
                        </td>

                        {/* Date Time */}
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {formatDateTime(item.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {!isLoading && !isError && data && data.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2 text-xs text-slate-500">
              <div>
                Showing <span className="font-extrabold text-slate-800 dark:text-white">
                  {((filters.page || 1) - 1) * (filters.limit || 20) + 1}
                </span> to <span className="font-extrabold text-slate-800 dark:text-white">
                  {Math.min((filters.page || 1) * (filters.limit || 20), data.pagination.total)}
                </span> of <span className="font-extrabold text-slate-800 dark:text-white">
                  {data.pagination.total}
                </span> entries
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-150 rounded-xl p-1 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <button
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                  className="p-2 hover:bg-slate-50 disabled:opacity-30 text-slate-700 dark:text-white rounded-lg transition disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-slate-805 dark:text-white font-extrabold px-3 select-none">
                  Page {filters.page} of {data.pagination.totalPages}
                </div>
                <button
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={filters.page === data.pagination.totalPages}
                  className="p-2 hover:bg-slate-50 disabled:opacity-30 text-slate-700 dark:text-white rounded-lg transition disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
