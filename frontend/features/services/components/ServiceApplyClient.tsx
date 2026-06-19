'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Wallet, FileText, CheckCircle2, HelpCircle, ShieldAlert, BadgeCheck, FileCheck2, ArrowRight } from 'lucide-react';
import { useServiceFormConfig } from '@/features/services/hooks/useServiceFormConfig';
import { useWalletBalance, useInvalidateWalletBalance } from '@/features/wallet/useWalletBalance';
import { useAuthStore } from '@/features/auth/authStore';
import DynamicServiceForm from './DynamicServiceForm';
import { useUpload, DocumentUploadField } from '@/features/uploads';
import OrderSummaryCard from './OrderSummaryCard';
import { useOrderSubmit } from '@/features/services/hooks/useOrderSubmit';
import PanFindApplyClient from './PanFindApplyClient';

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

  // Form validation payload tracking
  const invalidateWalletBalance = useInvalidateWalletBalance();
  const [validatedFormPayload, setValidatedFormPayload] = React.useState<any | null>(null);
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

  // Hook for Firebase Storage uploading
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

  const isCtaEnabled =
    consentGiven &&
    areAllDocsUploaded &&
    isBalanceSufficient &&
    !isSubmittingOrder;

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

  // Automated submit hook triggered once form validation completes successfully
  React.useEffect(() => {
    if (validatedFormPayload && service) {
      if (consentGiven && areAllDocsUploaded && isBalanceSufficient) {
        handleSubmitApplication(validatedFormPayload);
      } else {
        if (!consentGiven) {
          setLocalError('Please read and accept the declaration and consent checkbox.');
        } else if (!areAllDocsUploaded) {
          setLocalError(`Please upload all required documents (${uploadedCount}/${requiredDocCount} uploaded).`);
        } else if (!isBalanceSufficient) {
          setLocalError(`Insufficient balance. Required: ${formatCurrency(service.mrp)}, Available: ${formatCurrency(walletBalance)}.`);
        }
        setValidatedFormPayload(null);
      }
    }
  }, [validatedFormPayload]);

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

      {/* Premium Service Header Banner (Matching image1/image2 style) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-md">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
              <CheckCircle2 size={12} className="text-white fill-current" />
              Service Active
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {service.name}
            </h1>
            <p className="text-sm text-blue-100/90 max-w-3xl leading-relaxed">
              {service.shortDescription || service.description}
            </p>
          </div>
        </div>
      </div>



      {/* Price Badges Row (Fast2Pan Style) */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        {serviceSlug.toLowerCase().includes('pan') ? (
          <>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
              Physical PAN: {formatCurrency(service.mrp)}
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
              e-PAN: {formatCurrency(service.mrp)}
            </span>
          </>
        ) : (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
            Service Fee: {formatCurrency(service.mrp)}
          </span>
        )}
        <span className="text-xs text-slate-400 font-semibold ml-1">
          (Instant Debit from Wallet)
        </span>
      </div>

      {/* Main Form Area */}
      <DynamicServiceForm
        serviceSlug={serviceSlug}
        uploads={getMetadataMap()}
        userId={user?.id}
        onValidated={setValidatedFormPayload}
      />

      {/* Document Uploads Card */}
      {formConfig?.documents && formConfig.documents.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8">
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



      {/* Submission Errors */}
      {(localError || submitError) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 animate-in fade-in duration-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-normal">{localError || submitError}</p>
        </div>
      )}

      {/* Bottom Action and Wallet Summary Panel */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
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

        <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-2">
          <button
            type="submit"
            form="service-form"
            onClick={handleActionClick}
            disabled={isSubmittingOrder}
            className={`w-full md:w-auto px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center transition-all ${
              isSubmittingOrder
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-[#145BFF] hover:bg-blue-700 text-white active:scale-[0.98] shadow-lg shadow-blue-500/20'
            }`}
          >
            {isSubmittingOrder ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-white" />
                <span>Submitting Application...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Submit Application</span>
                <ArrowRight size={14} />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
