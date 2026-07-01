'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Wallet, FileText, CheckCircle2, HelpCircle, ShieldAlert, BadgeCheck, FileCheck2, ArrowRight, Send } from 'lucide-react';
import { useServiceFormConfig } from '@/features/services/hooks/useServiceFormConfig';
import { useWalletBalance, useInvalidateWalletBalance } from '@/features/wallet/useWalletBalance';
import { useAuthStore } from '@/features/auth/authStore';
import DynamicServiceForm from './DynamicServiceForm';
import { useUpload, DocumentUploadField } from '@/features/uploads';
import OrderSummaryCard from './OrderSummaryCard';
import { useOrderSubmit } from '@/features/services/hooks/useOrderSubmit';
import PanFindApplyClient from './PanFindApplyClient';
import PanServiceApplyClient from './PanServiceApplyClient';

interface ServiceApplyClientProps {
  serviceSlug: string;
}

export default function ServiceApplyClient({ serviceSlug }: ServiceApplyClientProps) {
  const router = useRouter();
  const { user, status } = useAuthStore();

  // Fetch wallet balance
  const { data: walletData, isLoading: isWalletLoading } = useWalletBalance();
  const walletBalance = walletData?.balance ?? 0;

  // Fetch service application config
  const {
    formConfig,
    isLoading: isServiceLoading,
    isError,
    error,
  } = useServiceFormConfig(serviceSlug);

  const service = formConfig?.service;
  const isPanPdfService = serviceSlug === 'pan-pdf-service';
  const isVoterPdfService = serviceSlug === 'voter-pdf';
  const isVoterMobileLinkService = serviceSlug === 'voter-mobile-number-link';

  // Form validation payload tracking
  const invalidateWalletBalance = useInvalidateWalletBalance();
  const [validatedFormPayload, setValidatedFormPayload] = React.useState<any | null>(null);
  const [isFormValidating, setIsFormValidating] = React.useState(false);
  const [consentGiven, setConsentGiven] = React.useState(true);
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Parse required document keys
  const requiredDocKeys = React.useMemo(() => {
    return formConfig?.documents?.map((d) => d.documentKey) || [];
  }, [formConfig]);

  // Parse required document keys that are marked as required
  const requiredKeys = React.useMemo(() => {
    return formConfig?.documents?.filter((d) => d.isRequired).map((d) => d.documentKey) || [];
  }, [formConfig]);

  // Hook for backend API document uploading
  const {
    uploadStates,
    uploadFile,
    removeFile,
    getMetadataMap,
    allRequiredUploaded,
  } = useUpload(requiredDocKeys, user?.id || '');

  // Real order submission hook
  const {
    submit: submitOrder,
    isSubmitting: isSubmittingOrder,
    submitError,
    successOrderId,
    clearError,
  } = useOrderSubmit({
    serviceId: service?.id ?? '',
    serviceName: service?.name ?? '',
    amount: service?.mrp ?? 0,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);

  // Safe checks for rendering and event handlers
  const isBalanceSufficient = service ? walletBalance >= service.mrp : false;
  const areAllDocsUploaded = allRequiredUploaded(requiredKeys);
  const isFormValidated = validatedFormPayload !== null;
  const uploadedDocuments = Object.values(getMetadataMap()).filter(Boolean) as any[];
  const uploadedCount = uploadedDocuments.length;
  const requiredDocCount = requiredKeys.length;

  const isPending = isSubmittingOrder || isFormValidating;

  const isCtaEnabled =
    consentGiven &&
    areAllDocsUploaded &&
    isBalanceSufficient &&
    !isPending;

  const handleSubmitApplication = async (payloadToSubmit?: any) => {
    const activePayload = payloadToSubmit || validatedFormPayload;
    if (!activePayload || !service) return;
    clearError();
    setLocalError(null);

    // Build field values from validated payload, resolving labels from config
    const fieldValues = Object.entries(activePayload as Record<string, string>).map(
      ([key, value]) => {
        const fieldDef = formConfig?.fields?.find((f) => f.fieldKey === key);
        return {
          fieldKey: key,
          fieldLabel: fieldDef?.label ?? key,
          value: String(value),
        };
      }
    );

    // Build documents payload, resolving document names as labels
    const documentsPayload = uploadedDocuments.map((d) => {
      const docDef = formConfig?.documents?.find((doc) => doc.documentKey === d.documentKey);
      return {
        ...d,
        documentLabel: docDef?.documentName ?? d.documentKey,
      };
    });

    try {
      const result = await submitOrder({
        fieldValues,
        documents: documentsPayload,
        consentGiven,
      });

      invalidateWalletBalance();
      router.push(`/dashboard/orders/success?orderId=${result.orderId}`);
    } catch (err) {
      console.error('Order submission failed:', err);
      setValidatedFormPayload(null);
    }
  };

  // Validate constraints when form is validated, but do NOT submit automatically
  React.useEffect(() => {
    if (validatedFormPayload && service) {
      if (!consentGiven) {
        setLocalError('Please read and accept the declaration and consent checkbox.');
        setValidatedFormPayload(null);
      } else if (!areAllDocsUploaded) {
        setLocalError(`Please upload all required documents (${uploadedCount}/${requiredDocCount} uploaded).`);
        setValidatedFormPayload(null);
      } else if (!isBalanceSufficient) {
        setLocalError(`Insufficient balance. Required: ${formatCurrency(service.mrp)}, Available: ${formatCurrency(walletBalance)}.`);
        setValidatedFormPayload(null);
      } else {
        setLocalError(null);
      }
    }
  }, [validatedFormPayload, consentGiven, areAllDocsUploaded, isBalanceSufficient]);

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setLocalError(null);
  };

  // 1. Auth check
  if (status === 'loading' || isWalletLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Loader2 size={24} className="absolute animate-pulse text-[#145BFF]" />
        </div>
        <p className="text-sm text-slate-500 font-bold tracking-wide animate-pulse">
          Verifying credentials & loading profile...
        </p>
      </div>
    );
  }

  // If not logged in
  if (status === 'unauthenticated' || !user) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm text-amber-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          Authentication Required
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          You must be logged in to apply for this service. Please sign in to your retailer dashboard.
        </p>
        <button
          onClick={() => router.push(`/login?redirect=/dashboard/services/${serviceSlug}/apply`)}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] text-sm uppercase tracking-wider"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  // If user role is admin
  if (user.role !== 'USER') {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm text-rose-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-medium">
          Only registered users/retailers can access this page. Admin accounts cannot apply for digital services directly.
        </p>
        <button
          onClick={() => router.push('/admin')}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] text-sm uppercase tracking-wider"
        >
          Go to Admin Console
        </button>
      </div>
    );
  }

  // If user status is inactive
  if (user.status !== 'ACTIVE') {
    return (
      <div className="max-w-md mx-auto my-16 bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm text-rose-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          Account Suspended
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed font-medium">
          Your account is currently inactive or suspended. Please contact our support team to activate your account.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-[0.98] text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Service loading state
  if (isServiceLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Loader2 size={20} className="absolute animate-pulse text-[#145BFF]" />
        </div>
        <p className="text-xs text-slate-500 font-bold tracking-wider animate-pulse">
          Loading service configuration...
        </p>
      </div>
    );
  }

  // Service error state
  if (isError || !service) {
    const apiErr = error as any;
    const isNotFound =
      apiErr?.response?.data?.error?.code === 'SERVICE_NOT_FOUND' ||
      apiErr?.status === 404;

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-700 transition-colors font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-12 flex flex-col items-center text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5 text-rose-500 shadow-sm">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
            {isNotFound ? 'Service Not Available' : 'Failed to Load Service'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
            {isNotFound
              ? 'This service is either inactive, does not exist, or its configuration is unavailable. Please select an active service.'
              : 'Unable to load service details. Please check your internet connection and try again.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Intercept for PAN Find page custom styling matching Image 2
  if (serviceSlug === 'pan-find' && service) {
    return (
      <PanFindApplyClient
        service={service}
        walletBalance={walletBalance}
        user={user}
      />
    );
  }

  // Intercept for upgraded PAN Apply and Correction services
  if ((serviceSlug === 'new-pan-apply' || serviceSlug === 'pan-correction') && service) {
    return (
      <PanServiceApplyClient
        serviceSlug={serviceSlug}
        service={service}
        walletBalance={walletBalance}
        user={user}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Navigation & Header Actions */}
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

      {/* Unified Card Container (Matching Image 2 Layout) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden text-left">
        
        {/* Premium Service Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-block p-1 bg-white text-blue-700 rounded-md shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white uppercase">
                {isPanPdfService ? 'NSDL PAN Original PDF' : isVoterPdfService ? 'Voter Original PDF Without OTP' : (serviceSlug.toLowerCase().includes('pan') ? 'NSDL EKYC / E-SIGN Base PAN Apply' : service.name)}
              </h1>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed font-medium pl-8">
              {isPanPdfService ? 'PAN, Aadhaar aur DOB details submit karein.' : isVoterPdfService ? 'Submit request with Voter ID and state details.' : (serviceSlug.toLowerCase().includes('pan') ? 'Applicant details carefully fill karein.' : (service.shortDescription || service.description))}
            </p>
          </div>

          <div className="relative flex items-center gap-3 shrink-0 self-end md:self-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-right min-w-[110px]">
              <p className="text-[8px] font-black text-blue-200/95 uppercase tracking-wider">Service Charge</p>
              <h4 className="text-sm md:text-base font-extrabold text-white mt-0.5">
                {formatCurrency(service.mrp)}
              </h4>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-right min-w-[110px]">
              <p className="text-[8px] font-black text-blue-200/95 uppercase tracking-wider">Wallet</p>
              <h4 className="text-sm md:text-base font-extrabold text-white mt-0.5">
                {formatCurrency(walletBalance)}
              </h4>
            </div>
          </div>
        </div>

        {/* Unified Card Body */}
        <div className="p-6 md:p-8 space-y-8 bg-white">

          {/* Main Form Area */}
          <DynamicServiceForm
            serviceSlug={serviceSlug}
            uploads={getMetadataMap()}
            userId={user?.id}
            onValidated={setValidatedFormPayload}
            onValidating={setIsFormValidating}
          />

          {/* Custom Bottom Section for PAN PDF Service (Image 1 style) */}
          {isPanPdfService && (
            <div className="pt-6 border-t border-slate-100 space-y-5 text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Amount</p>
                  <h4 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">
                    {formatCurrency(service.mrp)}
                  </h4>
                </div>
                
                <button
                  type={isFormValidated ? "button" : "submit"}
                  form={isFormValidated ? undefined : "service-form"}
                  onClick={isFormValidated ? () => handleSubmitApplication() : handleActionClick}
                  disabled={isFormValidated ? !isCtaEnabled : isPending}
                  className={`w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-750 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2`}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>{isFormValidated ? 'Confirm & Submit' : 'Submit Request'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100/70 text-[9px] md:text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                <span>📞</span>
                <span>Verification call only for submitted NSDL PAN PDF request. Customer details verify karke hi OTP lein.</span>
              </div>
            </div>
          )}

          {/* Custom Bottom Section for Voter PDF Service (Image 2 style) */}
          {isVoterPdfService && (
            <div className="pt-6 border-t border-slate-100 space-y-5 text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Amount</p>
                  <h4 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">
                    {formatCurrency(service.mrp)}
                  </h4>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                  <Link
                    href="/dashboard/orders"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition uppercase tracking-wider"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>View Requests</span>
                  </Link>

                  <button
                    type={isFormValidated ? "button" : "submit"}
                    form={isFormValidated ? undefined : "service-form"}
                    onClick={isFormValidated ? () => handleSubmitApplication() : handleActionClick}
                    disabled={isFormValidated ? !isCtaEnabled : isPending}
                    className={`px-6 py-3.5 bg-[#145BFF] hover:bg-blue-750 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2`}
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-white" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>{isFormValidated ? 'Confirm & Submit' : 'Submit Request'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Uploads Card */}
          {!isPanPdfService && !isVoterPdfService && formConfig?.documents && formConfig.documents.length > 0 && (
            <div className="pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="text-base font-extrabold text-slate-800 tracking-wide">
                  Required Document Uploads
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md uppercase tracking-wider">
                  Checklist
                </span>
              </div>

              <div className="space-y-5">
                {formConfig.documents.map((doc, idx) => (
                  <DocumentUploadField
                    key={idx}
                    documentKey={doc.documentKey}
                    label={doc.documentName}
                    description={`Supported formats: ${doc.allowedFileTypes.join(', ')}`}
                    isRequired={doc.isRequired}
                    state={uploadStates[doc.documentKey] || { status: 'idle', progress: 0, metadata: null, error: null, previewUrl: null }}
                    onUpload={(file) => uploadFile(doc.documentKey, file)}
                    onRemove={() => removeFile(doc.documentKey)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submission Errors */}
      {(localError || submitError) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 animate-in fade-in duration-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-normal">{localError || submitError}</p>
        </div>
      )}

      {/* Bottom Action and Wallet Summary Panel */}
      {!isPanPdfService && !isVoterPdfService && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Wallet Balance */}
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${isBalanceSufficient ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Wallet Balance</p>
                <h4 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5 flex items-center gap-2">
                  {formatCurrency(walletBalance)}
                  {!isBalanceSufficient && (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200 animate-pulse uppercase tracking-wider">
                      Low Balance
                    </span>
                  )}
                </h4>
              </div>
            </div>

            {/* Service Charge display */}
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-250 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                <FileCheck2 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Charge</p>
                <h4 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">
                  {formatCurrency(service.mrp)}
                </h4>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-2">
            <button
              type={isFormValidated ? "button" : "submit"}
              form={isFormValidated ? undefined : "service-form"}
              onClick={isFormValidated ? () => handleSubmitApplication() : handleActionClick}
              disabled={isFormValidated ? !isCtaEnabled : isPending}
              className={`w-full md:w-auto px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center transition-all ${
                isPending
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-[#145BFF] hover:bg-blue-700 text-white active:scale-[0.98] shadow-lg shadow-blue-500/20'
              }`}
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Submitting Application...</span>
                </div>
              ) : isFormValidated ? (
                <div className="flex items-center justify-center gap-2">
                  <span>Confirm & Submit Application</span>
                  <ArrowRight size={14} />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Validate & Review Details</span>
                  <ArrowRight size={14} />
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* View Submitted Requests Button for PAN PDF (Image 1 style) */}
      {isPanPdfService && (
        <div className="flex justify-end mt-4">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-[10px] uppercase tracking-wider shadow-2xs transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            View Submitted Requests
          </Link>
        </div>
      )}
    </div>
  );
}
