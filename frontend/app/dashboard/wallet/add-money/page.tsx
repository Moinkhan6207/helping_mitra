'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Wallet, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useWalletBalance } from '@/features/wallet/useWalletBalance';
import { useCreateRecharge, useRechargeConfig } from '@/features/wallet/rechargeApi';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

export default function AddMoneyPage() {
  const router = useRouter();
  const [amountStr, setAmountStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: balanceData, isLoading: isBalanceLoading } = useWalletBalance();
  const { data: config, isLoading: isConfigLoading } = useRechargeConfig();
  const createRechargeMutation = useCreateRecharge();

  const balance = balanceData?.balance ?? 0;

  // Limits from backend config (fallbacks just in case config loading is slow)
  const minLimitPaise = config?.minAmountPaise ?? 10000; // ₹100
  const maxLimitPaise = config?.maxAmountPaise ?? 2500000; // ₹25,000
  const minLimit = minLimitPaise / 100;
  const maxLimit = maxLimitPaise / 100;

  const presets = [100, 500, 1000, 2000];

  // Helper validation matching Zod requirements
  const validateAmount = (value: string): string | null => {
    if (!value) return 'Amount is required.';
    const num = Number(value);
    if (isNaN(num)) return 'Please enter a valid number.';
    if (!Number.isSafeInteger(num) || num <= 0 || value.includes('.')) {
      return 'Please enter a positive whole rupee amount (no decimals).';
    }
    if (num < minLimit) {
      return `Minimum recharge amount is ₹${minLimit}.`;
    }
    if (num > maxLimit) {
      return `Maximum recharge amount is ₹${maxLimit}.`;
    }
    return null;
  };

  const handlePresetClick = (val: number) => {
    setAmountStr(String(val));
    setErrorMsg(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(e.target.value);
    setErrorMsg(null);
  };

  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateAmount(amountStr);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      const num = Number(amountStr);
      const amountPaise = num * 100;

      const res = await createRechargeMutation.mutateAsync(amountPaise);
      
      // Redirect to the detail page of the created or existing active recharge
      router.push(`/dashboard/wallet/recharges/${res.recharge.id}`);
    } catch (err: any) {
      console.error('Recharge creation failed:', err);
      setErrorMsg(
        err?.response?.data?.message || 
        'Failed to initiate recharge request. Please try again.'
      );
    }
  };

  const isButtonDisabled = isConfigLoading || createRechargeMutation.isPending || !!validateAmount(amountStr);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/dashboard/wallet')}
          className="group flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Ledger
        </button>
      </div>

      {/* Main Topup Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-8 text-white">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
                <ShieldCheck size={13} className="text-emerald-400" />
                Secure Wallet Recharge
              </span>
            </div>

            <div className="space-y-1.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Add Money to Wallet
                </h1>
                <p className="text-sm text-blue-100/90 leading-relaxed max-w-xl">
                  Create a payment recharge request to load funds into your Mitra wallet.
                </p>
              </div>

              {/* Balance display inside header */}
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-inner flex items-center gap-3 shrink-0">
                <Wallet size={20} className="text-blue-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Current Balance</span>
                  <span className="text-lg font-black tracking-tight tabular-nums">
                    {isBalanceLoading ? 'Loading...' : formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className="p-6 md:p-8 space-y-6">
          <form onSubmit={handleProceed} className="space-y-5 max-w-xl mx-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Enter Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-500 select-none">
                  ₹
                </span>
                <input
                  type="text"
                  placeholder={`Min ${minLimit} - Max ${maxLimit}`}
                  value={amountStr}
                  onChange={handleAmountChange}
                  className="w-full bg-white border border-slate-200 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/10 rounded-2xl pl-10 pr-6 py-4 text-xl font-bold text-slate-800 placeholder:text-slate-350 focus:outline-none transition-all"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                * Enter whole rupees only. Decimal values are not allowed.
              </span>
            </div>

            {/* Preset Pills */}
            <div className="grid grid-cols-4 gap-2.5">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetClick(val)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-[0.98] ${
                    amountStr === String(val)
                      ? 'bg-blue-50 border-primary-blue text-primary-blue font-black'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-normal">{errorMsg}</p>
              </div>
            )}

            {/* Proceed Button */}
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="w-full py-4 bg-primary-blue hover:bg-secondary-blue disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {createRechargeMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Create Recharge Request</span>
                  <ChevronRight size={14} className="stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Instructions Box */}
          <div className="border-t border-slate-100 pt-6 max-w-xl mx-auto">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info size={13} className="text-primary-blue" />
              Important Instructions
            </h3>
            <ul className="text-xs text-slate-500 font-semibold space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <span>Recharge requests must be created before making payments. Do not transfer funds without generating a request.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <span>Recharges are processed in INR whole numbers (minimum ₹{minLimit}, maximum ₹{maxLimit}).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <span>You cannot modify a recharge amount once created. If you wish to change the amount, please initiate a new request.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <span>Creating a recharge request does not credit your wallet automatically. Payment verification details must be submitted in subsequent steps.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
