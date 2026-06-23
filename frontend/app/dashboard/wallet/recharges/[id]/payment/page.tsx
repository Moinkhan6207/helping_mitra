'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  Smartphone,
  AlertTriangle,
  QrCode,
  Info,
  CheckCircle2,
  Lock,
  MessageSquare,
  Phone
} from 'lucide-react';
import { 
  useRechargeDetails, 
  useRechargePayment, 
  useMarkPaymentInitiated, 
  useRechargeQR 
} from '@/features/wallet/rechargeApi';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

export default function RechargePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const rechargeId = params.id as string;

  const { data: recharge, isLoading: isRechargeLoading, isError: isRechargeError } = useRechargeDetails(rechargeId);
  const { data: paymentData, isLoading: isPaymentLoading, isError: isPaymentError } = useRechargePayment(rechargeId);
  const qrCodeUrl = useRechargeQR(rechargeId);
  const markPaymentInitiatedMutation = useMarkPaymentInitiated();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expiryCountdown, setExpiryCountdown] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} successfully!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Timer logic for payment expiry
  useEffect(() => {
    if (!paymentData?.paymentExpiresAt || recharge?.status === 'EXPIRED') {
      setExpiryCountdown('');
      return;
    }

    const interval = setInterval(() => {
      const expiryTime = new Date(paymentData.paymentExpiresAt).getTime();
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setExpiryCountdown('Expired');
        clearInterval(interval);
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setExpiryCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentData, recharge]);

  const handlePaymentInitiated = async () => {
    if (recharge?.status === 'CREATED') {
      try {
        await markPaymentInitiatedMutation.mutateAsync(rechargeId);
      } catch (err) {
        console.error('Failed to mark payment as initiated:', err);
      }
    }
  };

  const handleCompletedPayment = async () => {
    // 1. Mark as initiated if it is still CREATED
    if (recharge?.status === 'CREATED') {
      await handlePaymentInitiated();
    }
    // 2. Redirect to recharge detail page (where they can submit the UTR)
    router.push(`/dashboard/wallet/recharges/${rechargeId}?submitUTR=true`);
  };

  if (isRechargeLoading || isPaymentLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <Clock size={40} className="animate-spin text-primary-blue" />
        <p className="text-xs font-bold text-slate-500">Loading payment gateway details...</p>
      </div>
    );
  }

  if (isRechargeError || isPaymentError || !recharge || !paymentData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <AlertTriangle size={40} className="text-rose-500" />
        <h3 className="font-extrabold text-sm text-slate-800">Failed to load payment portal</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Please check your connection or return to dashboard.
        </p>
        <button
          onClick={() => router.push('/dashboard/wallet')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
        >
          Return to Wallet
        </button>
      </div>
    );
  }

  const requestedAmount = paymentData.amountPaise / 100;
  const isExpired = recharge.status === 'EXPIRED' || expiryCountdown === 'Expired' || new Date(paymentData.paymentExpiresAt) < new Date();

  // If expired, render blocked view
  if (isExpired) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 text-center flex flex-col items-center my-12 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-6 shadow-sm">
          <Clock size={32} />
        </div>
        <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 px-3 py-1 rounded-full border border-rose-200 tracking-wider mb-4">
          Recharge Expired
        </span>
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          This Recharge Request Has Expired
        </h2>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6 font-medium">
          Payments must be completed within 15 minutes of request creation. Please create a new recharge request.
        </p>
        <button
          onClick={() => router.push('/dashboard/wallet/add-money')}
          className="w-full py-3.5 bg-primary-blue hover:bg-secondary-blue text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
        >
          Create New Recharge
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white text-xs font-extrabold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-200 select-none">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/dashboard/wallet')}
          className="group flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Cancel Payment
        </button>
      </div>

      {/* Payment Step Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 select-none">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Step 1: Enter Amount */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xs font-black">
              <Check size={12} className="stroke-[3]" />
            </div>
            <span className="text-xs font-black text-slate-700 hidden sm:inline">1. Enter Amount</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-4" />

          {/* Step 2: Make Payment (Current) */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#145BFF] text-white flex items-center justify-center text-xs font-black ring-4 ring-[#145BFF]/15">
              2
            </div>
            <span className="text-xs font-black text-primary-blue">2. Make Payment</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-4" />

          {/* Step 3: Submit UTR */}
          <div className="flex items-center gap-2.5 opacity-50">
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">3. Submit UTR</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-4" />

          {/* Step 4: Verification */}
          <div className="flex items-center gap-2.5 opacity-50">
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
              4
            </div>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">4. Verification</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Payment QR & Form Details (Desktop/Mobile split) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Amount details */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Requested TopUp Amount
                </span>
                <span className="text-3xl font-black text-slate-900 block tracking-tight tabular-nums">
                  {formatCurrency(requestedAmount)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
                <Clock size={13} className="animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider tabular-nums">
                  Expires In: {expiryCountdown}
                </span>
              </div>
            </div>

            {/* Mobile-only Direct Intent Button */}
            <div className="block md:hidden space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <p className="text-xs text-slate-500 leading-normal text-center mb-4 font-semibold">
                  Click the button below to launch any supported UPI app installed on your phone.
                </p>
                
                <a
                  href={paymentData.upiUri}
                  onClick={handlePaymentInitiated}
                  className="w-full py-4 bg-primary-blue hover:bg-secondary-blue text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Smartphone size={15} />
                  <span>Pay with Any UPI App</span>
                </a>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                  OR PAY VIA QR
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>

            {/* Main Billing details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Payee Name */}
              <div className="border border-slate-200 p-4 rounded-2xl space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                  Payee Account Name
                </span>
                <span className="text-xs font-bold text-slate-800 block select-all">
                  {paymentData.payeeName || 'Helping Mitra'}
                </span>
              </div>

              {/* UPI ID */}
              <div className="border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                    Payee UPI VPA Address
                  </span>
                  <span className="text-xs font-bold text-slate-800 block select-all tabular-nums">
                    {paymentData.upiVpa}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(paymentData.upiVpa, 'UPI ID')}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-100"
                >
                  {copiedField === 'UPI ID' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Required Note / Remarks */}
              <div className="border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-2 sm:col-span-2">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                    Required Payment Note / Remarks
                  </span>
                  <span className="text-xs font-black text-primary-blue block select-all tabular-nums">
                    {paymentData.paymentNote}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(paymentData.paymentNote, 'Payment Note')}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-100"
                >
                  {copiedField === 'Payment Note' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Amount */}
              <div className="border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-2 sm:col-span-2">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                    Transfer Amount (INR)
                  </span>
                  <span className="text-xs font-bold text-slate-800 block select-all tabular-nums">
                    ₹{requestedAmount.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(String(requestedAmount), 'Amount')}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-100"
                >
                  {copiedField === 'Amount' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>

            </div>

            {/* Instruction Footer button */}
            <div className="pt-2">
              <button
                onClick={handleCompletedPayment}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] select-none"
              >
                <span>I Have Completed Payment</span>
              </button>
              <p className="text-[10px] text-center text-slate-400 font-semibold mt-2.5">
                Note: Clicking this button does not credit wallet balance. It registers your intent and moves to the UTR Submission stage.
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Dynamic QR code & Safety Warning Card */}
        <div className="space-y-6">
          
          {/* QR Code Container (Desktop priority) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <QrCode size={14} className="text-primary-blue" />
              Dynamic Recharge QR
            </h3>
            
            {/* Displaying QR */}
            {qrCodeUrl ? (
              <div className="w-56 h-56 border border-slate-150 rounded-2xl p-4 bg-white shadow-inner flex items-center justify-center relative select-none">
                <img 
                  src={qrCodeUrl} 
                  alt="UPI Payment QR Code" 
                  className="w-full h-full object-contain"
                  onLoad={handlePaymentInitiated}
                />
              </div>
            ) : (
              <div className="w-56 h-56 border border-slate-150 rounded-2xl bg-slate-50 animate-pulse flex items-center justify-center text-slate-350 text-xs font-bold">
                Generating QR...
              </div>
            )}

            <div className="text-[10px] text-slate-500 font-semibold leading-relaxed max-w-[220px]">
              Scan using any UPI App (GPay, PhonePe, Paytm, BHIM) to complete checkout.
            </div>
          </div>

          {/* Payment Safety Messages */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 select-none">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5 text-amber-600">
              <ShieldCheck size={14} />
              Verify Before Paying
            </h3>

            {/* Checklist */}
            <div className="text-[11px] space-y-2.5 font-semibold text-slate-600">
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400">Payee</span>
                <span className="text-slate-800">{paymentData.payeeName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400">UPI ID</span>
                <span className="text-slate-800 tabular-nums">{paymentData.upiVpa}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400">Amount</span>
                <span className="text-slate-900 font-extrabold tabular-nums">₹{requestedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-400">Recharge ID</span>
                <span className="text-slate-800 tabular-nums">{paymentData.rechargeNumber}</span>
              </div>
            </div>

            {/* Warnings warnings */}
            <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-xl space-y-2 text-[10px] font-semibold text-rose-800 leading-normal">
              <div className="flex items-start gap-1.5">
                <AlertTriangle size={12} className="shrink-0 mt-0.5 text-rose-500" />
                <span>Never share your UPI PIN or OTP with anyone.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle size={12} className="shrink-0 mt-0.5 text-rose-500" />
                <span>Helping Mitra will never ask for your UPI PIN or OTP.</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 justify-center pt-1 text-[9px] text-slate-400 font-bold">
              <Lock size={10} />
              <span>Secure Encrypted Channels Only</span>
            </div>
          </div>

          {/* Get Help & Support Integration Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-1.5 select-none">
              Get Help & Support
            </h3>
            
            <p className="text-[10px] text-slate-450 font-bold leading-relaxed">
              Most recharges are reviewed during support hours. If you face any issues with this payment, contact support.
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Copy Recharge ID */}
              <button
                onClick={() => handleCopy(recharge.rechargeNumber, 'supportRch')}
                className="w-full inline-flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Copy size={13} />
                  Copy Recharge ID
                </span>
                {copiedField === 'supportRch' ? (
                  <span className="text-[10px] text-emerald-600 font-black">Copied!</span>
                ) : (
                  <span className="text-[10px] text-slate-450 font-mono">{recharge.rechargeNumber}</span>
                )}
              </button>

              {/* WhatsApp Support */}
              <a
                href={`https://wa.me/919999999999?text=${encodeURIComponent(
                  `Hello, I need help with recharge ${recharge.rechargeNumber} for ₹${requestedAmount.toLocaleString('en-IN')}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all text-center active:scale-[0.98]"
              >
                <MessageSquare size={14} />
                WhatsApp Support
              </a>

              {/* Call Support */}
              <a
                href="tel:+919999999999"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all text-center active:scale-[0.98]"
              >
                <Phone size={14} />
                Call Support
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
