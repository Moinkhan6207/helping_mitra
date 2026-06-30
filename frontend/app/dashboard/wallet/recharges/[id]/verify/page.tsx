'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Upload, 
  X, 
  FileText, 
  AlertCircle, 
  Loader2, 
  ShieldAlert,
  Info,
  HelpCircle,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useRechargeDetails, useSubmitVerification, useMarkPaymentInitiated } from '@/features/wallet/rechargeApi';
import { useAuthStore } from '@/features/auth/authStore';
import axiosClient from '@/lib/axios';
import RechargeStepWizard from '../RechargeStepWizard';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export default function VerifyRechargePage() {
  const router = useRouter();
  const params = useParams();
  const rechargeId = params.id as string;

  const { user } = useAuthStore();
  const { data: recharge, isLoading, isError } = useRechargeDetails(rechargeId);
  const submitMutation = useSubmitVerification();
  const markPaymentInitiatedMutation = useMarkPaymentInitiated();

  // If user lands directly on verify page with CREATED status, auto mark as initiated
  useEffect(() => {
    if (recharge && recharge.status === 'CREATED') {
      markPaymentInitiatedMutation.mutate(rechargeId);
    }
  }, [recharge, rechargeId]);

  // Form states
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);

  // File Upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [proofStoragePath, setProofStoragePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submissionId] = useState(() => `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [activeTab, setActiveTab] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [showGuide, setShowGuide] = useState(false);

  // Auto clean UTR input and live validate format
  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Strip all spaces automatically
    const cleaned = rawVal.replace(/\s+/g, '');
    setUtr(cleaned);
    
    if (!cleaned) {
      setUtrError('UTR / Transaction Reference is required');
    } else if (cleaned.length < 12) {
      setUtrError('UTR must be at least 12 characters');
    } else if (cleaned.length > 22) {
      setUtrError('UTR must be at most 22 characters');
    } else if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
      setUtrError('UTR must contain only letters and numbers');
    } else {
      setUtrError(null);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Upload file handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      setUploadError('Invalid file type. Allowed: JPG, JPEG, PNG only.');
      setUploadStatus('error');
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File size exceeds the 5 MB maximum limit.');
      setUploadStatus('error');
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    setUploadStatus('uploading');
    setUploadProgress(0);

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('uploadSessionId', submissionId);
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
      console.error('Upload error:', err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields before submitting
    if (!utr) {
      setUtrError('UTR / Transaction Reference is required');
      return;
    }
    
    if (utrError) return;

    if (uploadStatus === 'uploading') {
      setUploadError('Please wait for file upload to complete.');
      return;
    }

    try {
      if (recharge && recharge.status === 'CREATED') {
        await markPaymentInitiatedMutation.mutateAsync(rechargeId);
      }
      await submitMutation.mutateAsync({
        rechargeId,
        utr,
        proofStoragePath: proofStoragePath || null,
      });
      setIsSubmittedSuccessfully(true);
    } catch (err: any) {
      // Parse API errors if available
      const apiMsg = err.response?.data?.message || err.message;
      setUtrError(apiMsg);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <Loader2 size={40} className="animate-spin text-[#145BFF]" />
        <p className="text-xs font-bold text-slate-500">Loading recharge request...</p>
      </div>
    );
  }

  if (isError || !recharge) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <AlertCircle size={40} className="text-rose-500 animate-bounce" />
        <h3 className="font-extrabold text-sm text-slate-800">Failed to load recharge details</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Please verify the URL is correct and you have permission to access this recharge.
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
  const isEligible = recharge.status === 'CREATED' || recharge.status === 'PAYMENT_INITIATED';

  if (!isEligible && !isSubmittedSuccessfully) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <ShieldAlert size={42} className="text-amber-500" />
        <h3 className="font-extrabold text-sm text-slate-800">Submission Blocked</h3>
        <p className="text-xs text-slate-500 max-w-md">
          This recharge request is in status <strong className="uppercase">{recharge.status}</strong> and is not eligible for verification submission.
        </p>
        <button
          onClick={() => router.push(`/dashboard/wallet/recharges/${rechargeId}`)}
          className="px-4 py-2 bg-[#145BFF] text-white rounded-xl text-xs font-bold transition-all"
        >
          View Recharge Details
        </button>
      </div>
    );
  }

  // ── CONFIRMATION SCREEN AFTER SUCCESSFUL SUBMISSION ───────────────────────
  if (isSubmittedSuccessfully) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
        {/* Step Wizard Progress Indicator showing Under Verification */}
        <RechargeStepWizard currentStep={4} status={recharge.status} />

        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600 animate-bounce" />
          </div>
          
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            ✔ Payment Submitted Successfully
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Your verification proof has been registered with our finance desk.
          </p>

          {/* Info Grid */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 my-6 space-y-3.5 text-left text-xs font-semibold text-slate-650">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-400">Recharge ID</span>
              <span className="text-slate-800 font-bold font-mono">{recharge.rechargeNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-400">Amount</span>
              <span className="text-slate-900 font-black text-sm tabular-nums">{formatCurrency(requestedAmount)}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60">
              <span className="text-slate-400">Current Status</span>
              <span className="inline-flex px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase">
                Under Verification
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Expected Verification Time</span>
              <span className="text-slate-800 font-extrabold text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                15 - 30 Minutes
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 text-primary-blue text-left mb-6">
            <Info size={16} className="shrink-0 mt-0.5 text-primary-blue" />
            <div className="text-[11px] font-semibold leading-relaxed">
              Payments are audited manually. Your wallet ledger balance will automatically update once verified.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => router.push(`/dashboard/wallet/recharges/${rechargeId}`)}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Track Recharge
            </button>
            <button
              onClick={() => router.push('/dashboard/wallet')}
              className="w-full py-3.5 bg-[#145BFF] hover:bg-[#145BFF]/95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.99]"
            >
              Back to Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VERIFICATION FORM SCREEN ──────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push(`/dashboard/wallet/recharges/${rechargeId}`)}
          className="group flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Request Details
        </button>
      </div>

      {/* Step Wizard Progress Indicator showing Submit Proof */}
      <RechargeStepWizard currentStep={3} status={recharge.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Step 3 of 5: Submit Proof
              </span>
              <h1 className="text-lg font-black text-slate-850 tracking-tight">
                Submit Payment Verification
              </h1>
              <p className="text-xs text-slate-500">
                Please enter your bank transfer reference details below to verify the recharge.
              </p>
            </div>

            {/* Payment Summary Box */}
            <div className="bg-[#145BFF]/5 border border-[#145BFF]/10 rounded-2xl p-4 grid grid-cols-2 gap-4 text-left">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Recharge ID</span>
                <span className="text-xs font-black text-slate-800">{recharge.rechargeNumber}</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Amount</span>
                <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(requestedAmount)}</span>
              </div>
              <div className="space-y-0.5 col-span-2 pt-2 border-t border-slate-200/50">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Payee Account Details</span>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-bold text-slate-700">{recharge.payeeNameSnapshot || 'Helping Mitra'} ({recharge.upiVpaSnapshot})</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(recharge.upiVpaSnapshot || '', 'vpa')}
                    className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                  >
                    {copiedField === 'vpa' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              
              {/* UTR Input */}
              <div className="space-y-2">
                <label htmlFor="utr-input" className="text-xs font-black text-slate-850 uppercase tracking-wide block">
                  UTR / Transaction Reference Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="utr-input"
                    type="text"
                    value={utr}
                    onChange={handleUtrChange}
                    placeholder="Enter 12-digit reference number"
                    className={`w-full bg-slate-50 border ${
                      utrError ? 'border-rose-350 focus:border-rose-450 focus:ring-rose-100' : 'border-slate-200 focus:border-[#145BFF] focus:ring-[#145BFF]/10'
                    } rounded-xl px-4 py-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                    disabled={submitMutation.isPending}
                  />
                  {utr && (
                    <button
                      type="button"
                      onClick={() => { setUtr(''); setUtrError('UTR / Transaction Reference is required'); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200/60 hover:bg-slate-200 text-slate-550 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {utrError ? (
                  <p className="text-[11px] text-rose-555 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {utrError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-1">
                    Standard UPI UTR is a 12-digit numeric code. Please enter the exact reference number from your payment confirmation.
                  </p>
                )}
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-850 uppercase tracking-wide block">
                  Payment Screenshot / Proof <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <p className="text-[10px] text-slate-450 font-bold leading-normal mb-1.5">
                  Optional but recommended. Uploading a screenshot helps us verify your recharge faster.
                </p>

                {uploadStatus === 'idle' && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#145BFF] bg-slate-50 hover:bg-[#145BFF]/5 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-150 flex items-center justify-center text-slate-400 group-hover:text-[#145BFF] transition-colors shadow-xs">
                      <Upload size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">Upload transaction screenshot</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">JPG, JPEG, or PNG up to 5 MB</p>
                    </div>
                  </div>
                )}

                {uploadStatus === 'uploading' && (
                  <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={13} className="animate-spin text-[#145BFF]" />
                        Uploading screenshot...
                      </span>
                      <span className="tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#145BFF] h-full rounded-full transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadStatus === 'success' && file && (
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Screenshot Preview" 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-150 bg-white" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                          <FileText size={20} />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="border border-rose-150 rounded-2xl p-4 bg-rose-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-left text-xs font-bold text-rose-700">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{uploadError || 'Failed to upload screenshot.'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold shadow-xs border border-slate-200 shrink-0"
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

              {/* Action Button */}
              <button
                type="submit"
                disabled={submitMutation.isPending || uploadStatus === 'uploading' || !!utrError}
                className={`w-full py-3.5 ${
                  submitMutation.isPending || uploadStatus === 'uploading' || !!utrError
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-none'
                    : 'bg-[#145BFF] hover:bg-[#145BFF]/95 text-white active:scale-[0.99] shadow-md'
                } font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2`}
              >
                {submitMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Submit Payment Proof
              </button>

            </form>
          </div>
        </div>

        {/* Right Column: UTR explanations & Guides */}
        <div className="space-y-6 text-left">
          
          {/* What is UTR Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-slate-100">
              <HelpCircle size={15} className="text-primary-blue" />
              What is UTR?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              UTR stands for <strong>Unique Transaction Reference</strong>. It is a 12-digit unique number generated by banking networks for every UPI or netbanking transaction.
            </p>
            <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Example UTR numbers</span>
              <code className="text-xs font-mono font-bold text-primary-blue block select-all tracking-widest bg-white border border-slate-200 px-2 py-1 rounded">620708677612</code>
              <code className="text-xs font-mono font-bold text-primary-blue block select-all tracking-widest bg-white border border-slate-200 px-2 py-1 rounded">012345678901</code>
            </div>
          </div>

          {/* Interactive Where is UTR modal card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Where is UTR in Apps?
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="text-[10px] font-black uppercase text-primary-blue hover:underline"
              >
                Expand Guide
              </button>
            </div>

            {/* Micro Selector tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
              {(['gpay', 'phonepe', 'paytm', 'bhim'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Guide contents */}
            {activeTab === 'gpay' && (
              <div className="space-y-1 text-xs leading-relaxed font-semibold text-slate-600">
                <p className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wider">Google Pay (GPay):</p>
                <p>History details me payment transaction select karein. Wahan 12-digit <strong>UPI Transaction ID</strong> hi UTR hai.</p>
              </div>
            )}
            {activeTab === 'phonepe' && (
              <div className="space-y-1 text-xs leading-relaxed font-semibold text-slate-600">
                <p className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wider">PhonePe App:</p>
                <p>History panel me click karke Helping Mitra payment open karein. Receipt details me <strong>UTR</strong> code clear dikhega.</p>
              </div>
            )}
            {activeTab === 'paytm' && (
              <div className="space-y-1 text-xs leading-relaxed font-semibold text-slate-600">
                <p className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wider">Paytm App:</p>
                <p>Balance & History select karein. Wahan details receipt statement me search code <strong>UPI Ref No</strong> (12 digits) hi UTR hai.</p>
              </div>
            )}
            {activeTab === 'bhim' && (
              <div className="space-y-1 text-xs leading-relaxed font-semibold text-slate-600">
                <p className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wider">BHIM App:</p>
                <p>Transactions logs me bank receipt summary select karein. Details list me <strong>Ref No</strong> ya <strong>Transaction ID</strong> search karein.</p>
              </div>
            )}
          </div>

          {/* Need help standard process guide */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200/60">
              Verification Guide
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Verify hone me kitna time lagta hai? Admin team is details ko 15-30 minutes me authenticate karegi. Support hours ke dauran credit instant processing complete ki jati hai.
            </p>
          </div>

        </div>
      </div>

      {/* Guide expand modal popup */}
      {showGuide && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in duration-150 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <HelpCircle size={16} className="text-[#145BFF]" />
                How to find UTR in UPI Apps
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-primary-blue bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded">Google Pay (GPay)</span>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-1">
                  Open GPay &rarr; Show transaction history &rarr; Open transaction &rarr; Copy 12-digit <strong>UPI Transaction ID</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-primary-blue bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded">PhonePe</span>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-1">
                  Open PhonePe &rarr; History &rarr; Tap Helping Mitra payment &rarr; Copy 12-digit number labeled <strong>UTR</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-primary-blue bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded">Paytm</span>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-1">
                  Open Paytm &rarr; Balance & History &rarr; Select transaction &rarr; Copy 12-digit <strong>UPI Ref No</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-primary-blue bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded">BHIM App</span>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-1">
                  Open BHIM &rarr; Transactions &rarr; Select payment &rarr; Copy 12-digit <strong>Ref No / Transaction ID</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
