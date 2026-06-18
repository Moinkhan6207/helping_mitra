import React from 'react';
import { usePriceHistory } from '../hooks/usePriceHistory';
import { X, Clock, AlertCircle } from 'lucide-react';

interface PriceHistoryModalProps {
  serviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ serviceId, isOpen, onClose }) => {
  const { data: response, isLoading, isError, error } = usePriceHistory(serviceId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-800">Price History Logs</h3>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
              {isLoading ? 'Loading audit logs...' : response?.serviceName || 'Service Price Audit'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-primary-blue animate-spin" />
              <p className="text-xs text-gray-400">Retrieving audit history...</p>
            </div>
          )}

          {isError && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-xs">
              <AlertCircle size={16} />
              <span>{error instanceof Error ? error.message : 'Failed to retrieve price history logs.'}</span>
            </div>
          )}

          {!isLoading && !isError && (!response?.history || response.history.length === 0) && (
            <div className="text-center py-12">
              <Clock className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="text-sm font-semibold text-gray-500">No price updates recorded</p>
              <p className="text-xs text-gray-400 mt-1">This service is still at its initial seeded price.</p>
            </div>
          )}

          {!isLoading && !isError && response?.history && response.history.length > 0 && (
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Old Fee</th>
                    <th className="px-4 py-3">New Fee</th>
                    <th className="px-4 py-3">Changed By</th>
                    <th className="px-4 py-3 text-right">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {response.history.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-gray-400 font-semibold">
                        ₹{record.oldMrp.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold">
                        ₹{record.newMrp.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {record.changedBy}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-right font-medium">
                        {new Date(record.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryModal;
