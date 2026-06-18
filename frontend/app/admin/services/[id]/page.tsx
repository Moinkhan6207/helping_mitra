'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useAdminServiceById } from '@/features/admin-services/hooks/useAdminServices';
import { usePriceHistory } from '@/features/admin-services/hooks/usePriceHistory';
import UpdateMrpModal from '@/features/admin-services/components/UpdateMrpModal';
import { ArrowLeft, Edit2, ShieldAlert, IndianRupee, History, Lock, Clock } from 'lucide-react';

interface Params {
  id: string;
}

export default function ServiceDetailsPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const { data: service, isLoading, isError, error } = useAdminServiceById(id);
  const { data: priceHistoryData, isLoading: isPriceHistoryLoading } = usePriceHistory(id);

  const [showMrpModal, setShowMrpModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse select-none">
        <div className="h-6 bg-gray-100 rounded-xl w-1/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-100 rounded-3xl" />
          <div className="h-96 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-3xl max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert size={40} className="mx-auto text-red-400" />
        <h3 className="text-lg font-bold text-gray-800">Failed to Load Service</h3>
        <p className="text-xs text-red-500">
          {error instanceof Error ? error.message : 'Service was not found or a connection issue occurred.'}
        </p>
        <Link
          href="/admin/services"
          className="inline-block px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold shadow-sm"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-primary-blue transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Services List</span>
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">{service.name}</h2>
            <span
              className={`text-[9px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider ${
                service.status === 'ACTIVE'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}
            >
              {service.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Update MRP Button */}
          <button
            onClick={() => setShowMrpModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-200 transition-all duration-200"
          >
            <IndianRupee size={13} />
            <span>Update MRP</span>
          </button>

          {/* Edit Config */}
          <Link
            href={`/admin/services/${service.id}/edit`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-semibold shadow-md shadow-primary-blue/20 transition-all duration-200"
          >
            <Edit2 size={13} />
            <span>Edit Configurations</span>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main: Service Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Core metadata */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase border-b border-gray-100 pb-2.5">
              Service Overview
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Category Group</span>
                <span className="text-xs font-bold text-gray-800 mt-1 block">{service.category.name}</span>
              </div>

              {/* MRP with update trigger */}
              <div className="group">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">MRP / Processing Fee</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-teal-600 font-mono">₹{service.mrp.toFixed(2)}</span>
                  <button
                    onClick={() => setShowMrpModal(true)}
                    title="Update MRP"
                    className="p-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-500 hover:text-teal-700 border border-teal-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <IndianRupee size={10} />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Display Order</span>
                <span className="text-xs font-bold text-gray-700 mt-1 block font-mono">#{service.displayOrder}</span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Result Delivery Type</span>
                  <Lock size={8} className="text-gray-300" />
                </div>
                <span className="text-xs font-bold text-primary-blue mt-1 block uppercase">{service.resultType}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Result Label</span>
                  <Lock size={8} className="text-gray-300" />
                </div>
                <span className="text-xs font-bold text-gray-700 mt-1 block">{service.resultLabel}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">URL Slug</span>
                <span className="text-xs font-bold text-gray-500 mt-1 block font-mono truncate">{service.slug}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Short Description</span>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 border border-gray-100 rounded-xl">
                {service.shortDescription}
              </p>
            </div>

            {service.description && (
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Instructions & Guidelines</span>
                <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 border border-gray-100 rounded-xl whitespace-pre-wrap">
                  {service.description}
                </div>
              </div>
            )}
          </div>

          {/* Card: Questionnaire Fields */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                Required Questionnaire ({service.fields?.length || 0})
              </h3>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                <Lock size={7} />
                Read-only in Phase 2
              </span>
            </div>
            {(!service.fields || service.fields.length === 0) ? (
              <p className="text-xs text-gray-400 py-4 italic">No dynamic questionnaire fields are configured for this service.</p>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-xl">
                <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 font-mono">Key</th>
                      <th className="px-4 py-3">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {service.fields.map((f, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-bold text-gray-800">{f.label}</span>
                            {f.placeholder && <p className="text-[10px] text-gray-400 font-normal mt-0.5">Placeholder: "{f.placeholder}"</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] uppercase font-bold rounded">
                            {f.fieldType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-500">{f.fieldKey}</td>
                        <td className="px-4 py-3">
                          {f.isRequired ? (
                            <span className="text-red-500 font-bold text-[10px]">REQUIRED</span>
                          ) : (
                            <span className="text-gray-400 font-semibold text-[10px]">OPTIONAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right side column */}
        <div className="space-y-6">
          {/* Required Documents */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                Required Documents ({service.documentRequirements?.length || 0})
              </h3>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                <Lock size={7} />
                Read-only
              </span>
            </div>
            {(!service.documentRequirements || service.documentRequirements.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="p-3 bg-gray-50 rounded-full mb-2">
                  <Lock size={16} className="text-gray-300" />
                </div>
                <p className="text-xs font-semibold text-gray-400">No document required.</p>
                <p className="text-[10px] text-gray-300 mt-0.5">This service has no document upload requirements.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {service.documentRequirements.map((doc, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2.5">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-gray-800">{doc.documentName}</span>
                      {doc.isRequired ? (
                        <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase">
                          Required
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full uppercase">
                          Optional
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Allowed Formats</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.allowedFileTypes.map((type) => (
                          <span key={type} className="px-1.5 py-0.5 bg-white text-gray-500 border border-gray-200 text-[8px] uppercase font-bold rounded">
                            {type.split('/')[1] || type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-[9px] font-mono text-gray-400 truncate">
                      Key: {doc.documentKey}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price History Panel */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <History size={12} className="text-teal-500" />
              <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                Price History
              </h3>
            </div>

            {isPriceHistoryLoading && (
              <div className="flex items-center justify-center py-6 gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-teal-500 animate-spin" />
                <span className="text-[10px] text-gray-400">Loading history...</span>
              </div>
            )}

            {!isPriceHistoryLoading && (!priceHistoryData?.history || priceHistoryData.history.length === 0) && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clock size={24} className="text-gray-200 mb-2" />
                <p className="text-xs font-semibold text-gray-400">No price updates yet</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Still at initial seeded price.</p>
              </div>
            )}

            {!isPriceHistoryLoading && priceHistoryData?.history && priceHistoryData.history.length > 0 && (
              <div className="space-y-2.5">
                {priceHistoryData.history.map((record, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-gray-400 line-through">₹{record.oldMrp.toFixed(2)}</span>
                        <span className="text-gray-300">→</span>
                        <span className="font-mono text-[11px] font-bold text-teal-600">₹{record.newMrp.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500 font-semibold">{record.changedBy}</span>
                      <span className="text-[9px] text-gray-400">
                        {new Date(record.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick update button at bottom */}
            <button
              onClick={() => setShowMrpModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <IndianRupee size={13} />
              Update MRP
            </button>
          </div>
        </div>
      </div>

      {/* Update MRP Modal */}
      {showMrpModal && (
        <UpdateMrpModal
          serviceId={service.id}
          serviceName={service.name}
          currentMrp={service.mrp}
          isOpen={showMrpModal}
          onClose={() => setShowMrpModal(false)}
          onSuccess={() => setShowMrpModal(false)}
        />
      )}
    </div>
  );
}
