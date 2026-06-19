'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Wallet, 
  AlertCircle, 
  Loader2, 
  QrCode, 
  Check, 
  CreditCard,
  History,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useWalletTopup } from '@/features/wallet/useWalletBalance';

export default function AddWalletPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMockGateway, setShowMockGateway] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{ transactionId: string; newBalance: number } | null>(null);

  const topupMutation = useWalletTopup();

  // Preset amount selectors
  const presets = [100, 500, 1000, 2000];

  const handlePresetClick = (val: number) => {
    setAmount(String(val));
    setErrorMsg(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setErrorMsg(null);
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (isNaN(num) || num < 100) {
      setErrorMsg('Minimum topup amount is ₹100.');
      return;
    }
    setErrorMsg(null);
    setShowMockGateway(true);
  };

  const handleSimulatePayment = async () => {
    setErrorMsg(null);
    try {
      const num = Number(amount);
      const res = await topupMutation.mutateAsync(num);
      setSuccessData(res);
      setShowMockGateway(false);
    } catch (err: any) {
      console.error('Topup failed:', err);
      setErrorMsg(err?.response?.data?.message || 'Payment simulation failed. Please try again.');
      setShowMockGateway(false);
    }
  };

  const handleCancelGateway = () => {
    setShowMockGateway(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/dashboard/wallet')}
          className="group flex items-center gap-2 text-xs text-slate-400 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Ledger
        </button>
      </div>

      {!successData ? (
        <>
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
                    Secure UPI Gateway
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    Helping Mitra Wallet TopUp
                  </h1>
                  <p className="text-sm text-blue-100/90 leading-relaxed max-w-xl">
                    Instant wallet recharge with real-time payment confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleProceed} className="space-y-5 max-w-xl mx-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Enter TopUp Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Minimum 100"
                      min="100"
                      value={amount}
                      onChange={handleAmountChange}
                      className="w-full bg-white border border-slate-200 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/10 rounded-2xl pl-10 pr-6 py-4 text-xl font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Preset Pills */}
                <div className="grid grid-cols-4 gap-2.5">
                  {presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePresetClick(val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-[0.98] ${
                        amount === String(val)
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
                  className="w-full py-4 bg-primary-blue hover:bg-secondary-blue active:scale-[0.99] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Secure Payment</span>
                  <ChevronRight size={14} className="stroke-[3]" />
                </button>
              </form>

              {/* Informational Cards Grid (Matching image 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                
                {/* Instant Credit */}
                <div className="bg-slate-50/50 border border-slate-200/80 p-4 rounded-xl flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Instant Credit</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                      Payment success ke baad wallet auto update.
                    </p>
                  </div>
                </div>

                {/* Ledger Record */}
                <div className="bg-slate-50/50 border border-slate-200/80 p-4 rounded-xl flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <History size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Ledger Record</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                      Har transaction wallet ledger me save.
                    </p>
                  </div>
                </div>

                {/* Live Status */}
                <div className="bg-slate-50/50 border border-slate-200/80 p-4 rounded-xl flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#145BFF]/10 text-primary-blue flex items-center justify-center shrink-0">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Live Status</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                      Payment status real-time verify hota hai.
                    </p>
                  </div>
                </div>

                {/* Safe Checkout */}
                <div className="bg-slate-50/50 border border-slate-200/80 p-4 rounded-xl flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Lock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Safe Checkout</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                      QR based UPI payment secure process.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </>
      ) : (
        /* Success Screen */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 text-center flex flex-col items-center max-w-xl mx-auto animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center mb-6 shadow-sm">
            <Check size={32} className="stroke-[3]" />
          </div>

          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 tracking-wider mb-4">
            Payment Success
          </span>

          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
            ₹{Number(amount).toFixed(2)} Added Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6 font-medium">
            Your wallet balance has been updated immediately. A ledger credit entry has been recorded in your ledger details.
          </p>

          {/* Details list */}
          <div className="w-full bg-slate-50 border border-slate-150 p-4 rounded-2xl text-left text-xs space-y-2.5 mb-8">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Transaction ID</span>
              <span className="text-slate-800 font-bold tabular-nums">{successData.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Payment Mode</span>
              <span className="text-slate-800 font-bold">UPI / GPay Mock</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">New Wallet Balance</span>
              <span className="text-emerald-600 font-black tabular-nums">₹{successData.newBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Return buttons */}
          <button
            onClick={() => router.push('/dashboard/wallet')}
            className="w-full py-3.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
          >
            Go to Wallet Ledger
          </button>
        </div>
      )}

      {/* Mock UPI Checkout Modal */}
      {showMockGateway && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center relative animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase mb-1">
              Secure UPI Payment Gateway
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-6">
              Simulation Portal
            </p>

            {/* Merchant Info */}
            <div className="w-full bg-slate-50 border border-slate-150 p-4 rounded-2xl text-center mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Paying Merchant
              </span>
              <span className="text-sm font-black text-slate-800 block mt-1">
                HELPING MITRA AGENCY SERVICES
              </span>
              <span className="text-2xl font-black text-primary-blue block mt-3 tabular-nums">
                ₹{Number(amount).toFixed(2)}
              </span>
            </div>

            {/* Mock QR Code Display */}
            <div className="w-44 h-44 border-4 border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center bg-white shadow-inner mb-6 relative group">
              <QrCode size={120} className="text-slate-800 shrink-0" />
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <CreditCard size={28} className="text-primary-blue animate-bounce" />
                <span className="text-[9px] font-bold text-slate-700 mt-2">Dynamic UPI QR Code</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed text-center mb-6">
              This is a sandbox simulation environment. Click the button below to simulate scan and successful transaction.
            </p>

            {/* Buttons */}
            <div className="w-full space-y-2.5">
              <button
                onClick={handleSimulatePayment}
                disabled={topupMutation.isPending}
                className="w-full py-3.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {topupMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Simulate Payment Success</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCancelGateway}
                disabled={topupMutation.isPending}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel Transaction
              </button>
            </div>

            <div className="flex items-center gap-1.5 justify-center mt-5 text-[10px] text-slate-400 font-semibold select-none">
              <Lock size={10} />
              <span>PCI-DSS Compliant Encryption Standard</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
