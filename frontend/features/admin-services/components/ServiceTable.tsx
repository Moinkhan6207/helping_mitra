import React from 'react';
import Link from 'next/link';
import { AdminServiceListItem } from '../types';
import { StatusToggle } from './StatusToggle';
import { Eye, Edit, History, AlertTriangle, IndianRupee } from 'lucide-react';

interface ServiceTableProps {
  services: AdminServiceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onStatusToggle: (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => void;
  onShowPriceHistory: (id: string) => void;
  onUpdateMrp: (service: AdminServiceListItem) => void;
  isStatusChanging: boolean;
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  pagination,
  onPageChange,
  onStatusToggle,
  onShowPriceHistory,
  onUpdateMrp,
  isStatusChanging,
}) => {
  const { page, limit, total, totalPages } = pagination;

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  if (services.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-2xl shadow-sm">
        <AlertTriangle className="mx-auto text-gray-300 mb-3" size={38} />
        <p className="text-sm font-semibold text-gray-500">No services found</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search query, category filters, or add a new service.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table container */}
      <div className="overflow-hidden border border-gray-100 bg-white rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Service Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">MRP (Fee)</th>
                <th className="px-6 py-4">Result Type</th>
                <th className="px-6 py-4">Result Label</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-gray-800 text-sm">{service.name}</span>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{service.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 font-semibold rounded-lg text-[10px] uppercase border border-indigo-100">
                      {service.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-teal-600 text-sm">₹{service.mrp.toFixed(2)}</span>
                      <button
                        onClick={() => onUpdateMrp(service)}
                        title="Update MRP"
                        className="p-1 rounded-lg hover:bg-teal-50 text-teal-400 hover:text-teal-600 transition-colors border border-transparent hover:border-teal-200"
                      >
                        <IndianRupee size={11} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <span className="font-semibold uppercase text-[10px] bg-primary-blue/10 text-primary-blue px-2 py-0.5 border border-primary-blue/15 rounded-md">
                        {service.resultType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-gray-600">{service.resultLabel}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusToggle
                      status={service.status}
                      onChange={() => onStatusToggle(service.id, service.status)}
                      disabled={isStatusChanging}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* Update MRP Button */}
                      <button
                        onClick={() => onUpdateMrp(service)}
                        title="Update MRP / Processing Fee"
                        className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-700 rounded-xl transition-colors border border-teal-100"
                      >
                        <IndianRupee size={14} />
                      </button>

                      {/* Price History Button */}
                      <button
                        onClick={() => onShowPriceHistory(service.id)}
                        title="Price History Audit Log"
                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-colors border border-gray-200"
                      >
                        <History size={14} />
                      </button>

                      {/* Details View */}
                      <Link
                        href={`/admin/services/${service.id}`}
                        title="View Details"
                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-colors border border-gray-200"
                      >
                        <Eye size={14} />
                      </Link>

                      {/* Edit service */}
                      <Link
                        href={`/admin/services/${service.id}/edit`}
                        title="Edit Service & Settings"
                        className="p-2 bg-primary-blue/10 hover:bg-primary-blue/20 text-primary-blue border border-primary-blue/20 rounded-xl transition-colors"
                      >
                        <Edit size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-1.5 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-700">{startIdx}</span> to{' '}
            <span className="font-semibold text-gray-700">{endIdx}</span> of{' '}
            <span className="font-semibold text-gray-700">{total}</span> services
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-700 font-semibold rounded-xl transition-colors disabled:cursor-not-allowed shadow-sm"
            >
              Previous
            </button>
            <div className="text-gray-600 font-bold px-3">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-gray-700 font-semibold rounded-xl transition-colors disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceTable;
