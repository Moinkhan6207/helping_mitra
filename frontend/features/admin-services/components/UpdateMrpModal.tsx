'use client';

import React, { useState, useEffect } from 'react';
import { X, IndianRupee, AlertTriangle, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { useAdminServices } from '../hooks/useAdminServices';
import { useQueryClient } from '@tanstack/react-query';

interface UpdateMrpModalProps {
  serviceId: string;
  serviceName: string;
  currentMrp: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpdateMrpModal: React.FC<UpdateMrpModalProps> = ({
  serviceId,
  serviceName,
  currentMrp,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  // Use undefined options so the list query does NOT fire — we only need the mutation
  const { updateMrp } = useAdminServices(undefined);

  const [mrpInput, setMrpInput] = useState('');
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMrpInput('');
      setReason('');
      setValidationError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const newMrp = parseFloat(mrpInput);
  const isValidNumber = !isNaN(newMrp);
  const hasChanged = isValidNumber && newMrp !== currentMrp;
  const priceDiff = hasChanged ? newMrp - currentMrp : 0;
  const priceDiffPercent = hasChanged ? ((priceDiff / currentMrp) * 100).toFixed(1) : null;

  const validate = (): string | null => {
    if (!mrpInput.trim()) return 'MRP is required.';
    if (isNaN(newMrp)) return 'MRP must be a valid number.';
    if (newMrp <= 0) return 'MRP must be a positive value greater than zero.';
    if (newMrp === 0) return 'MRP cannot be zero.';
    if (newMrp < 0) return 'MRP cannot be negative.';
    if (newMrp === currentMrp) return `New MRP must be different from the current price (₹${currentMrp.toFixed(2)}).`;
    if (!/^\d+(\.\d{0,2})?$/.test(mrpInput.trim())) return 'MRP can have at most 2 decimal places.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');

    try {
      await updateMrp.mutateAsync({ id: serviceId, mrp: newMrp });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      setValidationError(err?.response?.data?.message || err?.message || 'Failed to update MRP. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMrpInput(e.target.value);
    setValidationError('');
    setSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={!updateMrp.isPending ? onClose : undefined}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-xl">
              <IndianRupee size={16} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Update MRP</h3>
              <p className="text-[10px] text-gray-500 mt-0.5 max-w-[220px] truncate">
                {serviceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={updateMrp.isPending}
            className="p-1.5 rounded-lg hover:bg-teal-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Success State */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700">Price updated successfully!</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">History has been recorded.</p>
              </div>
            </div>
          )}

          {/* Current Price Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Current MRP</span>
              <span className="text-lg font-black text-gray-800 font-mono mt-1 block">₹{currentMrp.toFixed(2)}</span>
            </div>
            {hasChanged && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">New MRP</span>
                <span className={`text-lg font-black font-mono mt-1 block ${priceDiff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  ₹{newMrp.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Price Change Indicator */}
          {hasChanged && priceDiffPercent && (
            <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold ${
              priceDiff > 0
                ? 'bg-red-50 border-red-100 text-red-600'
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              <TrendingUp size={13} className={priceDiff < 0 ? 'rotate-180' : ''} />
              <span>
                {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(2)} ({priceDiff > 0 ? '+' : ''}{priceDiffPercent}%){' '}
                {priceDiff > 0 ? 'price increase' : 'price reduction'}
              </span>
            </div>
          )}

          {/* New MRP Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              New MRP (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={mrpInput}
                onChange={handleInputChange}
                placeholder="0.00"
                autoFocus
                disabled={updateMrp.isPending || success}
                className={`w-full pl-8 pr-4 py-3 border rounded-xl text-sm font-bold font-mono text-gray-800 focus:outline-none transition-all disabled:opacity-60 disabled:bg-gray-50 ${
                  validationError
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-200 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
                }`}
              />
            </div>
            {validationError && (
              <div className="flex items-center gap-1.5 mt-1">
                <AlertTriangle size={11} className="text-red-500 shrink-0" />
                <p className="text-[10px] text-red-500 font-semibold">{validationError}</p>
              </div>
            )}
          </div>

          {/* Validation Rules Hint */}
          <div className="text-[10px] text-gray-400 space-y-0.5 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="font-bold text-gray-500 mb-1">Pricing Rules</p>
            <p>• MRP must be a positive value greater than zero</p>
            <p>• MRP cannot be zero or negative</p>
            <p>• New price must be different from current price</p>
            <p>• Price change will be recorded in audit history</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMrp.isPending}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMrp.isPending || success || !mrpInput.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-teal-200"
            >
              {updateMrp.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <IndianRupee size={13} />
                  <span>Update MRP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateMrpModal;
