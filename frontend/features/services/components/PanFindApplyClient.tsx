'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Search, Contact, Wallet, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useOrderSubmit } from '@/features/services/hooks/useOrderSubmit';
import { serviceApi } from '@/features/services/api/service.api';
import { useInvalidateWalletBalance } from '@/features/wallet/useWalletBalance';

interface PanFindApplyClientProps {
  service: {
    id: string;
    name: string;
    slug: string;
    mrp: number;
    description?: string;
    shortDescription?: string;
  };
  walletBalance: number;
  user: any;
}

export default function PanFindApplyClient({ service, walletBalance, user }: PanFindApplyClientProps) {
  const router = useRouter();
  const invalidateWalletBalance = useInvalidateWalletBalance();

  const [aadhaar, setAadhaar] = useState('');
  const [consent, setConsent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Setup order submission hook
  const {
    submit: submitOrder,
    isSubmitting: isSubmittingOrder,
    submitError,
    clearError: clearSubmitError,
  } = useOrderSubmit({
    serviceId: service.id,
    serviceName: service.name,
    amount: service.mrp,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);

  const isBalanceSufficient = walletBalance >= service.mrp;

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Allow digits only
    if (val.length <= 12) {
      setAadhaar(val);
    }
    setValidationError(null);
    clearSubmitError();
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsent(e.target.checked);
    setValidationError(null);
    clearSubmitError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearSubmitError();

    // 1. Client-Side Validation
    if (!aadhaar) {
      setValidationError('Aadhaar Number is required.');
      return;
    }
    if (aadhaar.length !== 12) {
      setValidationError('Aadhaar Number must be exactly 12 digits.');
      return;
    }
    if (!consent) {
      setValidationError('Please confirm customer consent to proceed.');
      return;
    }
    if (!isBalanceSufficient) {
      setValidationError(
        `Insufficient wallet balance. Required: ${formatCurrency(service.mrp)}, Available: ${formatCurrency(
          walletBalance
        )}.`
      );
      return;
    }

    setIsValidating(true);

    try {
      // 2. Trigger Backend Dynamic Validation Layer
      const payload = {
        aadhaarNumber: aadhaar,
        userId: user?.id,
      };

      const response = await serviceApi.validateForm(service.slug, payload);

      if (response && response.isValid === false) {
        const errorMsg = response.errors?.[0]?.message || 'Server validation failed.';
        setValidationError(errorMsg);
        setIsValidating(false);
        return;
      }

      // 3. Submit Order
      const fieldValues = [
        {
          fieldKey: 'aadhaarNumber',
          fieldLabel: 'Aadhaar Number',
          value: aadhaar,
        },
      ];

      const result = await submitOrder({
        fieldValues,
        documents: [],
        consentGiven: consent,
      });

      invalidateWalletBalance();
      router.push(`/dashboard/orders/success?orderId=${result.orderId}`);
    } catch (err: any) {
      console.error('Validation or Order submission failed:', err);
      // Map validation errors array if returned by backend
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors) && apiErrors.length > 0) {
        setValidationError(apiErrors[0].message);
      } else {
        setValidationError(err?.response?.data?.message || err.message || 'Validation or order submission failed.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const displayError = validationError || submitError;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-xs text-slate-400 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Catalogue
        </button>
        <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100/50 rounded-full uppercase tracking-wider">
          Verified Active configuration
        </span>
      </div>

      {/* Main Container matching Image 2 */}
      <div className="max-w-3xl mx-auto w-full bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-100/60 overflow-hidden">
        {/* Deep Blue to Emerald Gradient Banner */}
        <div className="relative bg-gradient-to-r from-[#172554] via-[#0f5247] to-[#047857] p-8 text-white">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm">
                HELPING MITRA SECURE SERVICE
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-sm">
                Charge: {formatCurrency(service.mrp)}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Aadhaar To PAN Find
              </h1>
              <p className="text-xs md:text-sm text-emerald-100/90 font-medium max-w-2xl leading-relaxed">
                Customer consent ke saath Aadhaar number se PAN details find karein.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
          {/* Wallet Balance Alert Bar if Low */}
          {!isBalanceSufficient && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 animate-in fade-in duration-300">
              <ShieldAlert size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="text-xs font-bold">Low Wallet Balance</p>
                <p className="text-xs text-rose-600/90 mt-0.5 font-medium leading-normal">
                  Your current balance is {formatCurrency(walletBalance)}, which is less than the service charge of{' '}
                  {formatCurrency(service.mrp)}. Please{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/wallet/add-money')}
                    className="font-black underline hover:text-rose-900 transition-colors"
                  >
                    Add Money
                  </button>{' '}
                  to your wallet to proceed.
                </p>
              </div>
            </div>
          )}

          {/* Aadhaar Number Input */}
          <div className="space-y-2">
            <label htmlFor="aadhaarNumber" className="text-xs md:text-sm font-extrabold text-slate-700 tracking-wide uppercase block">
              Aadhaar Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400">
                <Contact size={20} />
              </div>
              <input
                type="text"
                id="aadhaarNumber"
                value={aadhaar}
                onChange={handleAadhaarChange}
                placeholder="Enter 12 Digit Aadhaar Number"
                className="pl-12 pr-4 py-4 w-full border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-base font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal bg-slate-50/50 focus:bg-white"
                disabled={isValidating || isSubmittingOrder}
              />
            </div>
          </div>

          {/* Dotted Orange Consent Checkbox Box */}
          <div className="border border-dashed border-orange-300/80 bg-orange-50/20 rounded-2xl p-4 md:p-5 flex items-start gap-3 transition-colors duration-250 hover:bg-orange-50/30">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={handleConsentChange}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer accent-emerald-600 shrink-0"
              disabled={isValidating || isSubmittingOrder}
            />
            <label
              htmlFor="consent"
              className="text-xs md:text-sm font-medium text-slate-700 cursor-pointer select-none leading-relaxed"
            >
              I confirm customer consent and agree to{' '}
              <span
                className="font-extrabold text-orange-600 hover:text-orange-700 transition-colors underline hover:no-underline"
              >
                Terms & Conditions
              </span>
            </label>
          </div>

          {/* Validation/Submission Error Alert */}
          {displayError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 animate-in fade-in duration-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <p className="text-xs font-bold leading-normal">{displayError}</p>
            </div>
          )}

          {/* Wallet Summary & Service Charge Panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isBalanceSufficient ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <Wallet size={20} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Wallet Balance</p>
                <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-0.5">
                  {formatCurrency(walletBalance)}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:border-l border-slate-200 sm:pl-4">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={20} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Service Charge</p>
                <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-0.5">
                  {formatCurrency(service.mrp)}
                </h4>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={isValidating || isSubmittingOrder || !isBalanceSufficient}
              className={`w-full py-4 rounded-2xl text-white font-extrabold transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 text-sm md:text-base tracking-wide ${
                isValidating || isSubmittingOrder
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                  : !isBalanceSufficient
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              }`}
            >
              {isValidating || isSubmittingOrder ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>{isValidating ? 'Validating Aadhaar...' : 'Submitting Order...'}</span>
                </>
              ) : (
                <>
                  <Search size={18} className="stroke-[2.5]" />
                  <span>Find PAN Now</span>
                </>
              )}
            </button>

            {/* Note Warning Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <p className="text-xs md:text-sm font-semibold text-slate-500 leading-relaxed">
                <span className="font-extrabold text-slate-700">Note:</span> Wrong Aadhaar entry chargeable ho sakti
                hai. Submit se pahle Aadhaar number confirm kar lein.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
