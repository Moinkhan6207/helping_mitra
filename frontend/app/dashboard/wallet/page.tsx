'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  Shield, 
  Info, 
  Search, 
  Calendar, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { useWalletBalance, useWalletLedger, WalletLedgerItem } from '@/features/wallet/useWalletBalance';
import { useAuthStore } from '@/features/auth/authStore';
import { useRouter } from 'next/navigation';
import { useMyRecharges } from '@/features/wallet/rechargeApi';

// Currency Formatter helper
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

// Date formatting helper matching image 1 format: "19-Jun-2026 08:28:01 PM"
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

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: balanceData, isLoading: isBalanceLoading } = useWalletBalance();
  const { data: ledgers, isLoading: isLedgerLoading, isError: isLedgerError, refetch: refetchLedgers, isFetching } = useWalletLedger();
  const { data: rechargesData, isLoading: isRechargesLoading } = useMyRecharges({ limit: 10 });

  const balance = balanceData?.balance ?? 0;

  // Format today's date in local time YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Filter & Search states
  const [fromDate, setFromDate] = useState(getTodayDateString());
  const [toDate, setToDate] = useState(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState('Select');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  // Local/Live table search state
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Pagination states
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting states
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Dynamic summary stats calculations
  const totalDebits = useMemo(() => {
    if (!ledgers) return 0;
    return ledgers
      .filter((l) => l.type === 'DEBIT')
      .reduce((sum, l) => sum + l.amount, 0);
  }, [ledgers]);

  const totalCredits = useMemo(() => {
    if (!ledgers) return 0;
    return ledgers
      .filter((l) => l.type === 'CREDIT')
      .reduce((sum, l) => sum + l.amount, 0);
  }, [ledgers]);

  // Click handler for filter Form Search button
  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedKeyword(searchKeyword);
    setCurrentPage(1);
  };

  // Click handler to clear all filters
  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('Select');
    setSearchKeyword('');
    setAppliedKeyword('');
    setTableSearchQuery('');
    setCurrentPage(1);
  };

  // Column sort toggler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc'); // default to descending for dates, asc for others if desired
    }
    setCurrentPage(1);
  };

  // Filtered and searched data calculation
  const filteredLedgers = useMemo(() => {
    if (!ledgers) return [];

    return ledgers.filter((item) => {
      // 1. Date Range filters
      if (fromDate) {
        const itemDate = new Date(item.createdAt);
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (itemDate < from) return false;
      }
      if (toDate) {
        const itemDate = new Date(item.createdAt);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (itemDate > to) return false;
      }

      // 2. Status filters
      if (statusFilter !== 'Select') {
        if (statusFilter.toUpperCase() !== 'SUCCESS') {
          return false; // Since all ledger writes are successful operations
        }
      }

      // 3. Keyword filters (applied on "Search" button click)
      if (appliedKeyword) {
        const query = appliedKeyword.toLowerCase();
        const matchesOrder = item.orderNumber?.toLowerCase().includes(query);
        const matchesService = item.serviceName?.toLowerCase().includes(query);
        const matchesRemark = item.remark?.toLowerCase().includes(query);
        const matchesUser = user?.mobile?.includes(query) || user?.name?.toLowerCase().includes(query);

        if (!matchesOrder && !matchesService && !matchesRemark && !matchesUser) {
          return false;
        }
      }

      // 4. Live Table Search query
      if (tableSearchQuery) {
        const query = tableSearchQuery.toLowerCase();
        const matchesOrder = item.orderNumber?.toLowerCase().includes(query);
        const matchesService = item.serviceName?.toLowerCase().includes(query);
        const matchesRemark = item.remark?.toLowerCase().includes(query);
        const matchesUser = user?.mobile?.includes(query);

        if (!matchesOrder && !matchesService && !matchesRemark && !matchesUser) {
          return false;
        }
      }

      return true;
    });
  }, [ledgers, fromDate, toDate, statusFilter, appliedKeyword, tableSearchQuery, user]);

  // Sorted list calculation
  const sortedLedgers = useMemo(() => {
    const result = [...filteredLedgers];

    result.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric comparisons
      if (['amount', 'balanceBefore', 'balanceAfter'].includes(sortField)) {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle Date comparison
      if (sortField === 'createdAt') {
        const t1 = new Date(aVal).getTime();
        const t2 = new Date(bVal).getTime();
        return sortDirection === 'asc' ? t1 - t2 : t2 - t1;
      }

      // String comparison fallback
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredLedgers, sortField, sortDirection]);

  // Paginated list calculation
  const paginatedLedgers = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedLedgers.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedLedgers, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(sortedLedgers.length / entriesPerPage);

  // Reset page index if entries limit changes
  useEffect(() => {
    setCurrentPage(1);
  }, [entriesPerPage]);

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1.5 inline text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    return (
      <span className="ml-1.5 text-primary-blue inline font-black">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wallet Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your wallet balance and transaction history.
          </p>
        </div>
        <button
          onClick={() => refetchLedgers()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats row with fully integrated live counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Available Wallet Balance Card */}
        <div className="bg-gradient-to-br from-[#0c1a30] via-[#0f2040] to-[#145BFF] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-blue-300" />
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">
                Available Wallet Balance
              </p>
            </div>

            {isBalanceLoading ? (
              <div className="h-10 w-40 bg-white/10 rounded-xl animate-pulse mt-2" />
            ) : (
              <p className="text-4xl font-black mt-2 tabular-nums tracking-tight">
                {formatCurrency(balance)}
              </p>
            )}

            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-blue-300 shrink-0" />
                <p className="text-[11px] text-blue-200">
                  Create recharge requests to add money.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/wallet/add-money')}
                className="px-3 py-1.5 bg-white text-primary-blue hover:bg-blue-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>

        {/* Total Debits card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                <TrendingDown size={15} className="text-rose-500" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Debits</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tabular-nums">
              {formatCurrency(totalDebits)}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">All time service application charges</p>
        </div>

        {/* Total Credits card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <TrendingUp size={15} className="text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Credits</span>
            </div>
            <p className="text-3xl font-black text-slate-900 tabular-nums">
              {formatCurrency(totalCredits)}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">All time manual wallet additions</p>
        </div>
      </div>

      {/* Recharge Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Pending Recharges Card (Left / Cols 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#145BFF] text-white px-5 py-3 flex items-center justify-between shrink-0">
            <span className="text-xs font-extrabold uppercase tracking-wider">Pending Recharges</span>
          </div>
          <div className="p-4 space-y-3 flex-grow">
            {isRechargesLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-slate-50 rounded animate-pulse" />
                <div className="h-10 bg-slate-50 rounded animate-pulse" />
              </div>
            ) : !rechargesData?.recharges.filter(r => r.status === 'CREATED' || r.status === 'PAYMENT_INITIATED' || r.status === 'VERIFICATION_PENDING').length ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 font-semibold text-xs h-full">
                <span>No active pending recharge requests.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Verification Pending Cards */}
                {rechargesData.recharges
                  .filter(r => r.status === 'VERIFICATION_PENDING')
                  .map((r: any) => (
                    <div key={r.id} className="bg-gradient-to-br from-blue-50/45 to-indigo-50/25 border border-blue-150 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-sm font-black text-slate-800">
                            ₹{(r.requestedAmountPaise / 100).toFixed(2)} Recharge
                          </span>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">
                            Verification Pending
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-semibold text-slate-500">
                          <div>
                            Recharge ID: <span className="font-bold text-slate-750">{r.rechargeNumber}</span>
                          </div>
                          {r.latestMaskedUtr && (
                            <div>
                              UTR: <span className="font-bold text-slate-755 font-mono">{r.latestMaskedUtr}</span>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            Submitted: <span className="font-bold text-slate-650">{r.submittedAt ? formatDateTime(r.submittedAt) : formatDateTime(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => router.push(`/dashboard/wallet/recharges/${r.id}`)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase transition-all shadow-xs"
                        >
                          View Details
                        </button>
                        <a
                          href="https://wa.me/919999999999"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-[#00a884] hover:bg-[#00a884]/95 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-xs text-center"
                        >
                          Contact Support
                        </a>
                      </div>
                    </div>
                  ))}

                {/* Normal Created/Initiated table */}
                {rechargesData.recharges.filter(r => r.status === 'CREATED' || r.status === 'PAYMENT_INITIATED').length > 0 && (
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 select-none">
                          <th className="px-4 py-2">Recharge Number</th>
                          <th className="px-4 py-2">Amount</th>
                          <th className="px-4 py-2">Created Date</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {rechargesData.recharges
                          .filter(r => r.status === 'CREATED' || r.status === 'PAYMENT_INITIATED')
                          .map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/40">
                              <td className="px-4 py-3 font-bold text-slate-800">{r.rechargeNumber}</td>
                              <td className="px-4 py-3 tabular-nums font-bold text-slate-700">₹{(r.requestedAmountPaise / 100).toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-500">{formatDateTime(r.createdAt)}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-105 uppercase">
                                  {r.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 space-x-2">
                                <button
                                  onClick={() => router.push(`/dashboard/wallet/recharges/${r.id}`)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded font-bold text-[10px] uppercase transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => router.push(`/dashboard/wallet/recharges/${r.id}`)}
                                  className="px-2 py-1 bg-[#145BFF] hover:bg-[#145BFF]/90 text-white rounded font-black text-[10px] uppercase transition-colors"
                                >
                                  Continue Payment
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recharge History Summary Card (Right / Col 1) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#00a884] text-white px-5 py-3 shrink-0">
            <span className="text-xs font-extrabold uppercase tracking-wider">Recharge History</span>
          </div>
          <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
            {isRechargesLoading ? (
              <div className="space-y-2">
                <div className="h-6 bg-slate-50 rounded animate-pulse" />
                <div className="h-6 bg-slate-50 rounded animate-pulse" />
              </div>
            ) : !rechargesData?.recharges.length ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 font-semibold text-xs flex-grow">
                <span>No recharges found.</span>
              </div>
            ) : (
              <div className="space-y-2.5 flex-grow">
                {rechargesData.recharges.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 block">{r.rechargeNumber}</span>
                      {r.latestMaskedUtr && (
                        <span className="text-[10px] font-mono text-slate-450 block">UTR: {r.latestMaskedUtr}</span>
                      )}
                      <span className="text-[9px] text-slate-400 font-bold block">Created: {formatDateTime(r.createdAt)}</span>
                      {r.submittedAt && (
                        <span className="text-[9px] text-slate-400 font-bold block">Submitted: {formatDateTime(r.submittedAt)}</span>
                      )}
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="font-black text-slate-900 block tabular-nums">₹{(r.requestedAmountPaise / 100).toFixed(2)}</span>
                      <span className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                        r.status === 'BALANCE_CREDITED'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : r.status === 'VERIFICATION_PENDING'
                          ? 'bg-blue-50 text-blue-600 border border-blue-105'
                          : r.status === 'EXPIRED' || r.status === 'REJECTED' || r.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {rechargesData && rechargesData.recharges.length > 0 && (
              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  onClick={() => router.push('/dashboard/wallet/add-money')}
                  className="text-xs font-black text-primary-blue hover:text-secondary-blue uppercase tracking-wider"
                >
                  Create New Recharge Request
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main Wallet Ledger Component replicating Image 1 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Coral Orange Header Bar */}
        <div className="bg-[#eb5757] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-white" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider">Walletledger</h2>
          </div>
          {(fromDate || toDate || statusFilter !== 'Select' || appliedKeyword || tableSearchQuery) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors text-white border border-white/10"
            >
              <X size={10} />
              Clear Filters
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Filters Form Container */}
          <form onSubmit={handleFilterSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
            {/* From Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar size={11} className="text-slate-400" />
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#eb5757] focus:ring-1 focus:ring-[#eb5757]/10"
              />
            </div>

            {/* To Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar size={11} className="text-slate-400" />
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#eb5757] focus:ring-1 focus:ring-[#eb5757]/10"
              />
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#eb5757] focus:ring-1 focus:ring-[#eb5757]/10"
              >
                <option value="Select">Select</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Keyword Search Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Search
              </label>
              <input
                type="text"
                placeholder="Username / Order ID / Number / Etc"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#eb5757] focus:ring-1 focus:ring-[#eb5757]/10"
              />
            </div>

            {/* Search Action Button */}
            <div>
              <button
                type="submit"
                className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm focus:outline-none"
              >
                Search
              </button>
            </div>
          </form>

          {/* Table Parameters Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            {/* Show Entries Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold select-none">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#eb5757] text-xs font-bold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Search Box on the Right */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={tableSearchQuery}
                onChange={(e) => {
                  setTableSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#eb5757] focus:ring-1 focus:ring-[#eb5757]/10 placeholder:text-slate-400"
              />
              {tableSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTableSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Ledger Table Container */}
          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            {isLedgerLoading ? (
              /* Table skeleton lines */
              <div className="p-8 space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-slate-50 border border-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ) : isLedgerError ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-rose-500">
                <Shield size={36} className="mb-3 text-rose-400 animate-bounce" />
                <h4 className="font-extrabold text-sm text-slate-800">Failed to load transactions</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">We couldn't connect to your transaction logs. Please check your network and try again.</p>
                <button
                  onClick={() => refetchLedgers()}
                  className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-slate-900/10"
                >
                  Retry request
                </button>
              </div>
            ) : sortedLedgers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <BookOpen size={40} className="text-slate-300 mb-3" />
                <h4 className="font-bold text-xs text-slate-800">No matching entries found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 font-semibold">There are no ledger entries matching the applied filters and search terms.</p>
                {(fromDate || toDate || statusFilter !== 'Select' || appliedKeyword || tableSearchQuery) && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 px-4 py-2 bg-blue-50 text-primary-blue hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors border border-blue-100"
                  >
                    Reset Filter Parameters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-500 font-bold select-none">
                    <th onClick={() => handleSort('serviceName')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Service {renderSortIndicator('serviceName')}
                    </th>
                    <th onClick={() => handleSort('orderNumber')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Order ID {renderSortIndicator('orderNumber')}
                    </th>
                    <th onClick={() => handleSort('type')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Type {renderSortIndicator('type')}
                    </th>
                    <th onClick={() => handleSort('amount')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Amount {renderSortIndicator('amount')}
                    </th>
                    <th onClick={() => handleSort('balanceBefore')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Opening {renderSortIndicator('balanceBefore')}
                    </th>
                    <th onClick={() => handleSort('amount')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Cr/Dr {renderSortIndicator('amount')}
                    </th>
                    <th onClick={() => handleSort('balanceAfter')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Closing {renderSortIndicator('balanceAfter')}
                    </th>
                    <th className="px-4 py-3">Description</th>
                    <th onClick={() => handleSort('createdAt')} className="px-4 py-3 cursor-pointer group hover:bg-slate-100/50 hover:text-slate-800 transition-colors">
                      Date Time {renderSortIndicator('createdAt')}
                    </th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">UserID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedLedgers.map((item: WalletLedgerItem) => {
                    const isDebit = item.type === 'DEBIT';
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Service name */}
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          {item.serviceSlug ? item.serviceSlug.toUpperCase().replace(/-/g, '') : 'SYSTEM'}
                        </td>

                        {/* Order ID */}
                        <td className="px-4 py-3.5 font-semibold text-slate-500 tabular-nums">
                          {item.orderNumber}
                        </td>

                        {/* Type badge */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDebit 
                              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {isDebit ? 'Debit' : 'Credit'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 tabular-nums text-slate-800 font-bold">
                          ₹ {item.amount}
                        </td>

                        {/* Opening */}
                        <td className="px-4 py-3.5 tabular-nums text-slate-500">
                          ₹ {item.balanceBefore}
                        </td>

                        {/* Cr/Dr */}
                        <td className="px-4 py-3.5 tabular-nums text-slate-800">
                          ₹ {item.amount}
                        </td>

                        {/* Closing */}
                        <td className="px-4 py-3.5 tabular-nums font-bold text-slate-850">
                          ₹ {item.balanceAfter}
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3.5 text-xs text-slate-500 max-w-xs truncate" title={item.remark}>
                          {item.remark}
                        </td>

                        {/* Date Time formatted */}
                        <td className="px-4 py-3.5 text-slate-500 tabular-nums">
                          {formatDateTime(item.createdAt)}
                        </td>

                        {/* Status (always Success for settled entries) */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black bg-[#00a884] text-white tracking-wide">
                            Success
                          </span>
                        </td>

                        {/* UserID */}
                        <td className="px-4 py-3.5 text-slate-500 tabular-nums">
                          {user?.mobile || '7805901336'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Pagination Footer controls */}
          {!isLedgerLoading && !isLedgerError && sortedLedgers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
              {/* Entries Info counts */}
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold select-none">
                Showing {Math.min(sortedLedgers.length, (currentPage - 1) * entriesPerPage + 1)} to{' '}
                {Math.min(sortedLedgers.length, currentPage * entriesPerPage)} of {sortedLedgers.length} entries
              </div>

              {/* Navigation button buttons */}
              <div className="flex items-center gap-1 select-none">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all font-semibold"
                >
                  <ChevronLeft size={14} className="text-slate-600" />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pg = idx + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${
                        currentPage === pg
                          ? 'bg-[#eb5757] border-[#eb5757] text-white shadow-sm shadow-[#eb5757]/20'
                          : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-350 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all font-semibold"
                >
                  <ChevronRight size={14} className="text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
