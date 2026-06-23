'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Filter, 
  Eye,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { useAdminRechargeQueue } from '@/features/wallet/rechargeApi';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

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
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
};

export default function AdminRechargesPage() {
  const router = useRouter();

  // Filter states
  const [status, setStatus] = useState('Select');
  const [userQuery, setUserQuery] = useState('');
  const [rechargeNumber, setRechargeNumber] = useState('');
  const [utr, setUtr] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  // Sliced API parameters
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, refetch, isFetching } = useAdminRechargeQueue({
    page,
    limit,
    ...appliedFilters,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: any = {};
    if (status !== 'Select') filters.status = status;
    if (userQuery.trim()) filters.user = userQuery.trim();
    if (rechargeNumber.trim()) filters.rechargeNumber = rechargeNumber.trim();
    if (utr.trim()) filters.utr = utr.trim();
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (amountMin.trim()) filters.amountMinPaise = Math.round(Number(amountMin) * 100);
    if (amountMax.trim()) filters.amountMaxPaise = Math.round(Number(amountMax) * 100);

    setAppliedFilters(filters);
    setPage(1);
  };

  const handleReset = () => {
    setStatus('Select');
    setUserQuery('');
    setRechargeNumber('');
    setUtr('');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setAppliedFilters({});
    setPage(1);
  };

  const summary = data?.summary || {
    pendingCount: 0,
    reviewCount: 0,
    creditedCount: 0,
    rejectedCount: 0,
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wallet Recharges Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor, audit, and claim ownership of incoming wallet top-up verifications.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-650 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verification Pending */}
        <div className="bg-white rounded-2xl border border-blue-150 p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Clock size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Verification Pending</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{summary.pendingCount}</span>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white rounded-2xl border border-amber-150 p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <User size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Under Review</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{summary.reviewCount}</span>
          </div>
        </div>

        {/* Credited Today */}
        <div className="bg-white rounded-2xl border border-emerald-150 p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Credited Today</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{summary.creditedCount}</span>
          </div>
        </div>

        {/* Rejected Today */}
        <div className="bg-white rounded-2xl border border-rose-150 p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Rejected Today</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{summary.rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100">
          <Filter size={14} className="text-slate-400" />
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Search & Filter Controls</h2>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            >
              <option value="Select">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="PAYMENT_INITIATED">Payment Initiated</option>
              <option value="VERIFICATION_PENDING">Verification Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="BALANCE_CREDITED">Balance Credited</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* User search query */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">User Details</label>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Name, email, mobile..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            />
          </div>

          {/* Recharge number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Recharge ID</label>
            <input
              type="text"
              value={rechargeNumber}
              onChange={(e) => setRechargeNumber(e.target.value)}
              placeholder="HM-RCH-XXXX..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            />
          </div>

          {/* UTR */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">UTR Reference</label>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="12-digit transaction UTR..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            />
          </div>

          {/* Date Range From */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Created Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            />
          </div>

          {/* Date Range To */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Created Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            />
          </div>

          {/* Min Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount Min (₹)</label>
            <input
              type="number"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder="Min value in Rupees..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            />
          </div>

          {/* Max Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount Max (₹)</label>
            <input
              type="number"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              placeholder="Max value in Rupees..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#145BFF]"
            />
          </div>

          {/* Form Actions */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#145BFF] hover:bg-[#145BFF]/95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.98]"
            >
              <Search size={12} />
              Search Requests
            </button>
          </div>

        </form>
      </div>

      {/* Main Table Queue Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-[#145BFF] text-white px-5 py-4 flex items-center gap-2 shrink-0">
          <FileCheck size={16} />
          <span className="text-xs font-extrabold uppercase tracking-wider">Top-up Verification Queue</span>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-4 py-12 flex flex-col items-center justify-center text-center">
              <Loader2 size={32} className="animate-spin text-[#145BFF]" />
              <p className="text-xs font-bold text-slate-500">Loading admin queue records...</p>
            </div>
          ) : isError || !data ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle size={36} className="text-rose-500" />
              <h3 className="font-extrabold text-sm text-slate-800 font-mono">Failed to load admin queue</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                There was an error communicating with the server. Please verify your permissions and try again.
              </p>
            </div>
          ) : data.recharges.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 font-semibold text-xs">
              <span>No recharge verification requests found matching your filter options.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Responsive Table */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 select-none">
                      <th className="px-4 py-3">Recharge Number</th>
                      <th className="px-4 py-3">User Details</th>
                      <th className="px-4 py-3">User Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Masked UTR</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3">Age Of Request</th>
                      <th className="px-4 py-3">Reviewer</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {data.recharges.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/45">
                        <td className="px-4 py-3.5 font-bold text-slate-850 font-mono">{r.rechargeNumber}</td>
                        <td className="px-4 py-3.5 space-y-0.5">
                          <span className="font-black text-slate-800 block">{r.userName}</span>
                          <span className="text-[10px] text-slate-450 font-bold block">{r.userMobile}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{r.userType || 'ADMIN'}</td>
                        <td className="px-4 py-3.5 font-black text-slate-900 tabular-nums">
                          {formatCurrency(r.requestedAmountPaise / 100)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-650 font-mono tracking-wide">{r.maskedUtr || '--'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                            r.status === 'VERIFICATION_PENDING'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : r.status === 'UNDER_REVIEW'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : r.status === 'BALANCE_CREDITED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : r.status === 'REJECTED' || r.status === 'CANCELLED' || r.status === 'EXPIRED'
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : 'bg-slate-50 text-slate-500 border-slate-150'
                          }`}>
                            {r.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 tabular-nums">
                          {r.submittedAt ? formatDateTime(r.submittedAt) : '--'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-650 flex items-center gap-1 mt-1 font-semibold">
                          <Clock size={11} className="text-slate-400" />
                          <span>{r.ageString}</span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {r.reviewerName ? (
                            <span className="font-bold text-slate-800">{r.reviewerName}</span>
                          ) : (
                            <span className="text-slate-400 font-semibold italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => router.push(`/admin/wallet/recharges/${r.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 hover:text-[#145BFF] border border-slate-200 text-slate-650 rounded-lg font-black text-[10px] uppercase transition-colors"
                          >
                            <Eye size={12} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                  <span>
                    Showing Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Fallback loader icon declaration since it wasn't directly in the lucide-react imports block
function Loader2({ size = 16, className = '' }) {
  return <Clock size={size} className={`animate-spin ${className}`} />;
}
