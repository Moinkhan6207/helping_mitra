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
  Info
} from 'lucide-react';
import { useRechargeDetails, useSubmitVerification } from '@/features/wallet/rechargeApi';
import { useAuthStore } from '@/features/auth/authStore';
import axiosClient from '@/lib/axios';

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
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mt-8 p-6 text-center animate-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center mx-auto mb-5">
          <Check size={32} className="text-[#145BFF] animate-pulse" />
        </div>
        
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Payment Details Submitted
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your payment proof has been queued for validation.
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
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status</span>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">
              Verification Pending
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 text-primary-blue text-left mb-6">
          <Info size={16} className="shrink-0 mt-0.5 text-primary-blue" />
          <div className="text-[11px] font-semibold leading-relaxed">
            Your payment is being reviewed. Your wallet will be credited after approval.
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/wallet')}
          className="w-full py-3 bg-[#145BFF] hover:bg-[#145BFF]/95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.99]"
        >
          Return to Wallet
        </button>
      </div>
    );
  }

  // ── VERIFICATION FORM SCREEN ──────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Step 3 of 3: Verification Details
          </span>
          <h1 className="text-lg font-black text-slate-850 tracking-tight">
            Submit Payment Verification
          </h1>
          <p className="text-xs text-slate-500">
            Please enter your bank transfer reference details below to verify the recharge.
          </p>
        </div>

        {/* Payment Summary Box */}
        <div className="bg-[#145BFF]/5 border border-[#145BFF]/10 rounded-2xl p-4 grid grid-cols-2 gap-4">
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
        <form onSubmit={handleSubmit} className="space-y-5">
          
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
                placeholder="Enter 12-digit or alphanumeric reference"
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
              <p className="text-[11px] text-rose-550 font-bold flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                {utrError}
              </p>
            ) : (
              <div className="space-y-2 mt-1">
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                  Standard UPI UTR is a 12-digit numeric code. Please enter the exact reference number from your payment confirmation.
                </p>
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-start gap-2">
                  <Info size={14} className="shrink-0 mt-0.5 text-slate-500" />
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    <strong>How to find UTR:</strong> Open your UPI app &rarr; Payment History &rarr; Open the transaction &rarr; Copy UTR or transaction reference.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-850 uppercase tracking-wide block">
              Payment Screenshot / Proof <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>

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
            Submit Verification
          </button>

        </form>

      </div>
    </div>
  );
}
