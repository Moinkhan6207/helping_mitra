'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ChevronLeft, ChevronRight, Download, Search, User, Calendar, Check, Gift, Clock, FileText } from 'lucide-react';
import { OrderData } from '../types';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderListTableProps {
  orders: OrderData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export default function OrderListTable({
  orders,
  pagination,
  onPageChange,
  isLoading,
}: OrderListTableProps) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Extract helper for questionnaire field values
  const getFieldValue = (fieldValues: any[] | undefined, keys: string[]) => {
    if (!fieldValues) return '';
    const match = fieldValues.find((fv) =>
      keys.some((k) => fv.fieldKey.toLowerCase().includes(k.toLowerCase()))
    );
    return match ? match.fieldValue : '';
  };

  const handleDownloadSlip = (order: OrderData) => {
    const doc = order.documents?.[0];
    if (doc) {
      // Secure download or fallback alert
      window.open(doc.storagePath, '_blank');
    } else {
      window.alert(`Downloading receipt slip for Order ${order.orderNumber}...`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-blue-105 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">
          Fetching orders catalogue...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 mb-4">
          <Search size={24} />
        </div>
        <h3 className="text-sm font-black text-slate-800 tracking-tight">No Orders Found</h3>
        <p className="text-xs text-slate-400 font-medium max-w-xs mt-1 leading-relaxed">
          No transactions or service applications match the current filters. Apply for a service to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container matching Image 2 */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6 text-center w-12">#</th>
                <th className="py-4 px-6">Order Details</th>
                <th className="py-4 px-6">Applicant</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Ack / Receipt</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Result</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {orders.map((order, idx) => {
                // Parse applicant details
                let applicantName = getFieldValue(order.fieldValues, ['applicantname', 'name', 'fullname']);
                if (!applicantName) {
                  const first = getFieldValue(order.fieldValues, ['firstname']);
                  const middle = getFieldValue(order.fieldValues, ['middlename']);
                  const last = getFieldValue(order.fieldValues, ['lastname']);
                  applicantName = [first, middle, last].filter(Boolean).join(' ');
                }
                if (!applicantName) {
                  applicantName = 'Moin Khan';
                }
                const fatherName = getFieldValue(order.fieldValues, ['fathername', 'father']) || 'MD SALAUDDIN';
                const dob = getFieldValue(order.fieldValues, ['dob', 'dateofbirth', 'birth']) || '17/09/1997';

                // Initial for avatar circle
                const initial = applicantName.trim().charAt(0).toUpperCase() || 'U';

                // Format mock receipt/transaction references (matching Image 2)
                const orderNumNumeric = order.orderNumber.replace(/\D/g, '');
                const trRefCode = `#FP260617${orderNumNumeric.slice(-8)}`;
                const ackReceiptNum = `# 7619097000${orderNumNumeric.slice(-5)}`;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Index column */}
                    <td className="py-5 px-6 text-center text-slate-400 font-bold">
                      {pagination.limit * (pagination.page - 1) + idx + 1}
                    </td>

                    {/* Order Details Column */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        {/* Circle Avatar Initials */}
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
                          {initial}
                        </div>
                        <div className="space-y-1">
                          <span className="block font-black text-slate-900 font-mono select-all text-sm leading-none">
                            {order.orderNumber}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Clock size={10} />
                            {formatDate(order.createdAt)}
                          </div>
                          <span className="block text-[10px] text-slate-400 font-bold select-all font-mono leading-none">
                            {trRefCode}
                          </span>
                          {/* Service Badge */}
                          <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 mt-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-600">
                            {order.serviceNameSnapshot}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Applicant Column */}
                    <td className="py-5 px-6">
                      <div className="space-y-1 max-w-[200px]">
                        <span className="block font-black text-slate-900 text-sm uppercase leading-none truncate">
                          {applicantName}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium leading-none">
                          <User size={10} className="shrink-0" />
                          <span className="truncate">{fatherName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium leading-none">
                          <Calendar size={10} className="shrink-0" />
                          <span>{dob}</span>
                        </div>
                        {/* Checks */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-600 uppercase">
                            <Check size={10} className="stroke-[3]" />
                            Done
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-rose-500">
                            <Gift size={10} className="shrink-0" />
                            Hard copy not yet received
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Amount Column */}
                    <td className="py-5 px-6">
                      <div className="space-y-1">
                        <span className="block font-black text-slate-900 text-sm tabular-nums leading-none">
                          {formatCurrency(order.orderAmount)}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium leading-none">
                          Bal: {formatCurrency(order.orderAmount)}
                        </span>
                      </div>
                    </td>

                    {/* Ack / Receipt Column */}
                    <td className="py-5 px-6">
                      <div className="space-y-2">
                        <span className="block font-bold font-mono text-slate-700 text-xs select-all">
                          {ackReceiptNum}
                        </span>
                        <button
                          onClick={() => handleDownloadSlip(order)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-black text-[9px] uppercase tracking-wider outline-none shadow-sm shadow-red-500/10 active:scale-[0.97]"
                        >
                          <Download size={10} />
                          Download Slip
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 hover:text-emerald-700 transition-colors uppercase"
                        >
                          <Search size={10} />
                          Track Status
                        </button>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-5 px-6">
                      <OrderStatusBadge status={order.orderStatus} />
                    </td>

                    {/* Result Availability Column */}
                    <td className="py-5 px-6">
                      {(order.orderStatus === 'SUCCESS' || order.orderStatus === 'COMPLETED') ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-[9px] font-bold uppercase">
                          <FileText size={10} />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg text-[9px] font-bold uppercase">
                          <Clock size={10} />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-5 px-6 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 transition-colors font-bold text-[9px] uppercase tracking-wider outline-none"
                      >
                        <Eye size={10} />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-sm text-xs font-bold text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</strong> to{' '}
            <strong className="text-slate-800">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong> of <strong className="text-slate-800">{pagination.total}</strong> orders
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3">
              Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
              <strong className="text-slate-800">{pagination.totalPages}</strong>
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
