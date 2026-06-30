'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  AlertCircle, 
  HelpCircle,
  FileText,
  User,
  ExternalLink,
  Smartphone,
  Info,
  Loader2,
  Upload,
  X,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { 
  useRechargeDetails, 
  useProofUrl,
  useResubmitVerification,
  useCancelRecharge,
  useRechargePayment,
  useMarkPaymentInitiated
} from '@/features/wallet/rechargeApi';
import { useAuthStore } from '@/features/auth/authStore';
import { useWalletBalance } from '@/features/wallet/useWalletBalance';
import axiosClient from '@/lib/axios';

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

export default function RechargeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rechargeId = params.id as string;
  const showSubmitUTRBanner = searchParams.get('submitUTR') === 'true';

  const { data: recharge, isLoading, isError, refetch } = useRechargeDetails(rechargeId);
  const { data: paymentData } = useRechargePayment(rechargeId);
  const markPaymentInitiatedMutation = useMarkPaymentInitiated();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expiryCountdown, setExpiryCountdown] = useState<string>('');

  const { user } = useAuthStore();
  const { data: balanceData } = useWalletBalance();
  const cancelMutation = useCancelRecharge();
  const resubmitMutation = useResubmitVerification();

  // Cancel dialog state
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Resubmission states
  const [resubmitUtr, setResubmitUtr] = useState('');
  const [resubmitUtrError, setResubmitUtrError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [proofStoragePath, setProofStoragePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resubmitSubmissionId, setResubmitSubmissionId] = useState('');

  // Timeline sorting
  const [timelineSortOrder, setTimelineSortOrder] = useState<'asc' | 'desc'>('desc');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setResubmitSubmissionId(`resub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
    setResubmitUtr('');
    setFile(null);
    setUploadStatus('idle');
    setPreviewUrl(null);
    setProofStoragePath(null);
  }, [rechargeId]);

  const handleCancelRecharge = async () => {
    try {
      await cancelMutation.mutateAsync(rechargeId);
      setIsCancelConfirmOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(selectedFile.type)) {
      setUploadError('Invalid file type. Allowed: JPG, JPEG, PNG only.');
      setUploadStatus('error');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5 MB maximum limit.');
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    setUploadStatus('uploading');
    setUploadProgress(0);

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('uploadSessionId', resubmitSubmissionId);
      formData.append('documentKey', 'recharge-proof');

      const response = await axiosClient.post('/uploads/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      });

      setUploadStatus('success');
      setProofStoragePath(response.data.data.storagePath);
    } catch (err: any) {
      console.error('Resubmit upload error:', err);
      setUploadError(err?.message || 'Failed to upload screenshot.');
      setUploadStatus('error');
    }
  };

  const handleRemoveFile = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);

    const path = proofStoragePath;
    setProofStoragePath(null);

    if (path) {
      try {
        await axiosClient.delete('/uploads/document', {
          params: { storagePath: path },
        });
      } catch (err) {
        console.warn('File deletion failed:', err);
      }
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resubmitUtr && !proofStoragePath) {
      setResubmitUtrError('Either a corrected UTR or a new screenshot is required to resubmit.');
      return;
    }

    if (resubmitUtr && resubmitUtrError) return;

    if (uploadStatus === 'uploading') {
      setUploadError('Please wait for file upload to complete.');
      return;
    }

    try {
      await resubmitMutation.mutateAsync({
        rechargeId,
        utr: resubmitUtr.trim() || null,
        proofStoragePath: proofStoragePath || null,
      });
      setResubmitUtr('');
      setFile(null);
      setUploadStatus('idle');
      setPreviewUrl(null);
      setProofStoragePath(null);
      refetch();
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      setResubmitUtrError(apiMsg);
    }
  };

  const handleResubmitUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleaned = rawVal.replace(/\s+/g, '');
    setResubmitUtr(cleaned);
    
    if (!cleaned) {
      setResubmitUtrError(null);
    } else if (cleaned.length < 12) {
      setResubmitUtrError('UTR must be at least 12 characters');
    } else if (cleaned.length > 22) {
      setResubmitUtrError('UTR must be at most 22 characters');
    } else if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
      setResubmitUtrError('UTR must contain only letters and numbers');
    } else {
      setResubmitUtrError(null);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Timer logic for payment expiry
  useEffect(() => {
    if (!recharge?.paymentExpiresAt || recharge.status !== 'CREATED') {
      setExpiryCountdown('');
      return;
    }

    const interval = setInterval(() => {
      const expiryTime = new Date(recharge.paymentExpiresAt!).getTime();
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setExpiryCountdown('Expired');
        clearInterval(interval);
        refetch();
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setExpiryCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [recharge, refetch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <Clock size={40} className="animate-spin text-primary-blue" />
        <p className="text-xs font-bold text-slate-500">Loading recharge request details...</p>
      </div>
    );
  }

  if (isError || !recharge) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <AlertCircle size={40} className="text-rose-500" />
        <h3 className="font-extrabold text-sm text-slate-800">Failed to load recharge details</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Please verify the URL is correct and you have permission to view this recharge request.
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

  const requestedAmount = (recharge.requestedAmountPaise ?? 0) / 100;
  const isExpired = recharge.status === 'EXPIRED' || (recharge.paymentExpiresAt && new Date(recharge.paymentExpiresAt) < new Date());
  const isActive = recharge.status === 'CREATED' || recharge.status === 'PAYMENT_INITIATED';

  // ── 13.8 Credited Page success state view ──────────────────────────────────
  if (recharge.status === 'BALANCE_CREDITED') {
    const currentBalance = balanceData?.balance ?? 0;

    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mt-8 p-6 text-center animate-in zoom-in duration-300 space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 size={32} className="text-emerald-600 animate-bounce" />
        </div>
        
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Wallet Credited Successfully
          </h1>
          <p className="text-xs text-slate-500">
            Recharge ID: <span className="font-bold font-mono">{recharge.rechargeNumber}</span>
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3.5">
          <div className="text-center">
            <span className="text-[10px] uppercase font-black tracking-wide text-slate-500 block mb-1">Added Amount</span>
            <span className="text-3xl font-black text-emerald-650 tracking-tight tabular-nums">
              {formatCurrency(requestedAmount)}
            </span>
            <span className="text-xs text-slate-450 block mt-1 font-semibold">
              has been added to your wallet.
            </span>
          </div>

          <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-400">Available Balance</span>
            <span className="text-slate-800 font-extrabold text-sm tabular-nums">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => router.push('/dashboard/wallet')}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Go to Wallet
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 bg-[#145BFF] hover:bg-[#145BFF]/90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.99]"
          >
            Use a Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Verification Notice / UTR Submission Banner */}
      {recharge.status === 'VERIFICATION_PENDING' ? (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-primary-blue animate-in fade-in duration-200">
          <Info size={16} className="shrink-0 text-primary-blue animate-pulse" />
          <p className="text-xs font-black uppercase tracking-wider">
            Your payment is being reviewed. Your wallet will be credited after approval.
          </p>
        </div>
      ) : showSubmitUTRBanner && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-primary-blue animate-in fade-in duration-200">
          <Info size={16} className="shrink-0 text-primary-blue animate-pulse" />
          <p className="text-xs font-black uppercase tracking-wider">
            Submit your UTR for verification.
          </p>
        </div>
      )}

      {/* Payment Safety Notice */}
      <div className="bg-amber-50/50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-start gap-2.5 shadow-sm animate-in fade-in duration-300">
        <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-600 animate-pulse" />
        <div className="text-xs font-semibold leading-relaxed">
          <strong className="font-extrabold uppercase text-[10px] block mb-0.5 text-amber-900">Payment Security Notice:</strong>
          Never share your UPI PIN or OTP. Helping Mitra will never ask for your UPI PIN or OTP. Ensure you only transfer payments to the official VPA displayed above.
        </div>
      </div>

      {/* Back button */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push('/dashboard/wallet')}
          className="group flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details Panel (Left / Cols 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Status & ID Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Recharge Reference
                </span>
                <h1 className="text-lg font-black text-slate-800 tracking-tight">
                  {recharge.rechargeNumber}
                </h1>
              </div>
              <div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  recharge.status === 'BALANCE_CREDITED' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : isExpired || recharge.status === 'REJECTED' || recharge.status === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {recharge.status}
                </span>
              </div>
            </div>

            {/* Requested Amount Block */}
            <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-black tracking-wide text-slate-500">
                  Requested TopUp Amount
                </span>
                <span className="text-3xl font-black text-slate-900 block tracking-tight tabular-nums">
                  {formatCurrency(requestedAmount)}
                </span>
              </div>

              {/* Action for continuing payment / submitting UTR */}
              {isActive && !isExpired && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {expiryCountdown && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider select-none">
                      <Clock size={12} className="animate-pulse" />
                      <span className="tabular-nums">{expiryCountdown}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {paymentData?.upiUri && (
                      <a
                        href={paymentData.upiUri}
                        onClick={async () => {
                          if (recharge.status === 'CREATED') {
                            try {
                              await markPaymentInitiatedMutation.mutateAsync(recharge.id);
                            } catch (err) {
                              console.error('Failed to mark payment initiated:', err);
                            }
                          }
                        }}
                        className="md:hidden px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
                      >
                        <Smartphone size={13} />
                        Pay via UPI App
                      </a>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/wallet/recharges/${recharge.id}/payment`)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Pay / View QR
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/wallet/recharges/${recharge.id}/verify`)}
                      className="px-3.5 py-2 bg-[#145BFF] hover:bg-[#145BFF]/90 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
                    >
                      Verify / Submit UTR
                    </button>
                    <button
                      onClick={() => setIsCancelConfirmOpen(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* UPI Details section (Immutable Snapshots) */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                UPI Merchant Account snapshots
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Payee Name */}
                <div className="border border-slate-200 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                    Payee Name
                  </span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {recharge.payeeNameSnapshot || 'Helping Mitra'}
                  </span>
                </div>

                {/* VPA */}
                <div className="border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                      UPI VPA / Address
                    </span>
                    <span className="text-xs font-bold text-slate-800 block tabular-nums">
                      {recharge.upiVpaSnapshot}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(recharge.upiVpaSnapshot || '', 'vpa')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                    title="Copy UPI VPA"
                  >
                    {copiedField === 'vpa' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Payment Note */}
                <div className="border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-2 sm:col-span-2">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">
                      Required Payment Note (Remarks)
                    </span>
                    <span className="text-xs font-black text-primary-blue block tabular-nums">
                      {recharge.paymentNote}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(recharge.paymentNote || '', 'note')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                    title="Copy Payment Note"
                  >
                    {copiedField === 'note' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>

              </div>
            </div>

            {/* Instruction Warning for Payee Notes */}
            {isActive && !isExpired && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 text-amber-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="text-[11px] font-semibold leading-relaxed">
                  <strong className="font-extrabold uppercase text-[10px] block mb-0.5">Payment Notice:</strong>
                  Apne UPI App (GPay/PhonePe/Paytm) se upar diye gaye VPA par <strong>{formatCurrency(requestedAmount)}</strong> transfer karein. Transaction remarks/notes me copy kiya hua <strong>{recharge.paymentNote}</strong> zaroor daalein.
                </div>
              </div>
            )}

            {/* Resubmission Section - visible if status is REJECTED */}
            {recharge.status === 'REJECTED' && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 pb-2">
                  <ShieldCheck size={18} className="text-rose-500" />
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Resubmit Payment Verification
                  </h2>
                </div>

                {recharge.rejectionReason && (
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-xs leading-relaxed">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-650" />
                    <div>
                      <strong className="text-rose-950 font-extrabold uppercase text-[10px] block mb-0.5">Reason for Rejection:</strong>
                      <p className="text-[11px] text-slate-700 font-bold">{recharge.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {recharge.resubmissionCount >= (recharge.maxResubmissionLimit ?? 3) ? (
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-xs leading-relaxed">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <strong>Maximum verification attempts reached.</strong>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Please contact support using the support tools to resolve your recharge.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleResubmit} className="space-y-4 bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl">
                    <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
                      You can correct your UTR number, upload a fresh screenshot, or both to resubmit for verification. Attempt {recharge.resubmissionCount + 1} of {recharge.maxResubmissionLimit ?? 3}.
                    </p>

                    {/* UTR Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-450 block tracking-wider">
                        Corrected UTR / Reference (Optional if screenshot provided)
                      </label>
                      <input
                        type="text"
                        value={resubmitUtr}
                        onChange={handleResubmitUtrChange}
                        placeholder="Enter corrected 12-digit UPI UTR"
                        className={`w-full px-4 py-2.5 bg-white border ${
                          resubmitUtrError ? 'border-rose-350 focus:border-rose-450' : 'border-slate-200 focus:border-[#145BFF]'
                        } rounded-xl text-xs font-semibold text-slate-800 transition-all outline-none`}
                        disabled={resubmitMutation.isPending}
                      />
                      {resubmitUtrError && (
                        <p className="text-[10px] text-rose-550 font-bold flex items-center gap-1 mt-0.5">
                          <AlertCircle size={10} />
                          {resubmitUtrError}
                        </p>
                      )}
                    </div>

                    {/* Proof File upload */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wider">
                        Updated Screenshot / Proof (Optional if UTR provided)
                      </label>

                      {uploadStatus === 'idle' && (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border border-dashed border-slate-300 hover:border-[#145BFF] bg-white hover:bg-[#145BFF]/5 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1 group"
                        >
                          <Upload size={14} className="text-slate-400 group-hover:text-[#145BFF]" />
                          <p className="text-[11px] font-bold text-slate-700">Upload fresh proof screenshot</p>
                        </div>
                      )}

                      {uploadStatus === 'uploading' && (
                        <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Loader2 size={11} className="animate-spin text-[#145BFF]" />
                              Uploading...
                            </span>
                            <span className="tabular-nums">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#145BFF] h-full rounded-full transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'success' && file && (
                        <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between gap-3 animate-in fade-in duration-200">
                          <div className="flex items-center gap-2">
                            {previewUrl ? (
                              <img src={previewUrl} alt="Preview" className="w-10 h-10 rounded object-cover border border-slate-150 bg-slate-50" />
                            ) : (
                              <FileText size={16} className="text-slate-400" />
                            )}
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-750 rounded-full transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {uploadStatus === 'error' && (
                        <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <span className="text-[11px] font-bold text-rose-700">{uploadError || 'Upload failed'}</span>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="px-2 py-1 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded text-[9px] font-bold transition-all shrink-0"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={resubmitMutation.isPending || uploadStatus === 'uploading' || (!resubmitUtr && !proofStoragePath) || !!resubmitUtrError}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-550 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] flex items-center gap-1.5"
                      >
                        {resubmitMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                        Resubmit Details
                      </button>
                    </div>

                  </form>
                )}
              </div>
            )}

            {/* Verification Submissions history */}
            {recharge.submissions && recharge.submissions.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Verification Submission History
                </h2>

                <div className="space-y-3">
                  {recharge.submissions.map((sub: any) => (
                    <div key={sub.id} className="border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Submission #{sub.submissionNumber}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${
                            sub.status === 'BALANCE_CREDITED'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : sub.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : sub.status === 'VERIFICATION_PENDING'
                              ? 'bg-blue-50 text-blue-600 border border-blue-105'
                              : 'bg-slate-50 text-slate-650 border border-slate-105'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold">
                          UTR: <span className="font-bold text-slate-700 font-mono tracking-wider">{sub.utr}</span>
                          <span className="mx-2 text-slate-350">|</span>
                          Submitted: <span className="font-medium text-slate-650">{formatDateTime(sub.submittedAt)}</span>
                        </div>
                        {sub.adminRemarks && (
                          <div className="text-[11px] text-rose-600 bg-rose-50/50 p-2 rounded-lg mt-1 border border-rose-100/50">
                            <strong>Admin remarks:</strong> {sub.adminRemarks}
                          </div>
                        )}
                      </div>

                      {/* Proof Actions */}
                      {sub.proofStoragePath && (
                        <ProofLink rechargeId={recharge.id} submissionId={sub.id} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Audit Timeline & Meta Panel (Right / Col 1) */}
        <div className="space-y-6">
          
          {/* Metadata Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
              Request Metadata
            </h3>
            
            <div className="text-[11px] space-y-3 font-semibold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Created Date</span>
                <span className="text-slate-800 tabular-nums">{formatDateTime(recharge.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Expiry</span>
                <span className="text-slate-800 tabular-nums">
                  {recharge.paymentExpiresAt ? formatDateTime(recharge.paymentExpiresAt) : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Submission Deadline</span>
                <span className="text-slate-800 tabular-nums">
                  {recharge.utrSubmissionDeadline ? formatDateTime(recharge.utrSubmissionDeadline) : '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resubmissions</span>
                <span className="text-slate-800 tabular-nums">{recharge.resubmissionCount}</span>
              </div>
            </div>
          </div>

          {/* Get Help & Support Integration Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
              Get Help & Support
            </h3>
            
            <p className="text-[10px] text-slate-450 font-bold leading-relaxed">
              Most recharges are reviewed during support hours. If you face any issues with this recharge, contact support.
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
                href={`https://wa.me/917999713744?text=${encodeURIComponent(
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
                href="tel:+917999713744"
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all text-center active:scale-[0.98]"
              >
                Call Support
              </a>
            </div>
          </div>

          {/* Audit Timeline Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Status Timeline
              </h3>
              <select
                value={timelineSortOrder}
                onChange={(e) => setTimelineSortOrder(e.target.value as 'asc' | 'desc')}
                className="bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold px-2 py-1 outline-none cursor-pointer focus:border-[#145BFF]"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            {/* Vertical timeline */}
            <div className="relative pl-4 border-l border-slate-150 space-y-5 ml-1">
              {([...(recharge.auditLogs || [])].sort((a, b) => {
                const tA = new Date(a.createdAt).getTime();
                const tB = new Date(b.createdAt).getTime();
                return timelineSortOrder === 'desc' ? tB - tA : tA - tB;
              })).map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline point */}
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-blue border-2 border-white shadow-xs" />
                  
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-slate-800 block">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.remarks && (
                      <span className="text-[11px] text-slate-500 block leading-tight font-semibold">
                        {log.remarks}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                      <span className="capitalize">{log.performedByUser?.name ? `${log.performedByUser.name} (${log.performedByUser.role})` : 'System'}</span>
                      <span>•</span>
                      <span className="font-mono">{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
      {/* Cancel Confirmation Modal */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={24} className="shrink-0 animate-bounce" />
              <h3 className="text-sm font-black uppercase tracking-wider">Cancel Recharge Request</h3>
            </div>
            
            <p className="text-xs text-slate-650 leading-relaxed">
              Are you sure you want to cancel recharge request <strong className="font-extrabold text-slate-900">{recharge.rechargeNumber}</strong> for <strong className="font-extrabold text-slate-900">{formatCurrency(requestedAmount)}</strong>?
            </p>

            <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-2.5">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-semibold leading-relaxed">
                This action is permanent and will cancel the request. Do not send funds for a cancelled recharge.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-bold transition-all"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelRecharge}
                disabled={cancelMutation.isPending}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-350 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                {cancelMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ProofLink({ rechargeId, submissionId }: { rechargeId: string; submissionId: string }) {
  const [clicked, setClicked] = useState(false);
  const { data, isLoading } = useProofUrl(rechargeId, submissionId, clicked);

  useEffect(() => {
    if (data?.signedUrl && clicked) {
      window.open(data.signedUrl, '_blank');
      setClicked(false);
    }
  }, [data, clicked]);

  return (
    <button
      onClick={() => setClicked(true)}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase transition-all shadow-xs shrink-0 disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <Loader2 size={12} className="animate-spin text-[#145BFF]" />
          Loading Proof...
        </>
      ) : (
        <>
          <ExternalLink size={12} />
          View Proof
        </>
      )}
    </button>
  );
}
