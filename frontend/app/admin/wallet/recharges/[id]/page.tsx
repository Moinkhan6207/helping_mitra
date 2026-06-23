'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Eye,
  Download,
  AlertTriangle,
  Info,
  Loader2,
  ExternalLink,
  User,
  Wallet,
  FileText,
  Calendar,
  Hash,
} from 'lucide-react';
import {
  useAdminRechargeDetails,
  useStartReview,
  useAdminProofUrl,
  useApproveRecharge,
  useRejectRecharge,
} from '@/features/wallet/rechargeApi';
import { useAuthStore } from '@/features/auth/authStore';

// ── FORMATTERS ────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '--';
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

// ── STATUS BADGE ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    BALANCE_CREDITED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
    VERIFICATION_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200',
    EXPIRED: 'bg-slate-50 text-slate-500 border-slate-200',
    PAYMENT_INITIATED: 'bg-purple-50 text-purple-700 border-purple-200',
    CREATED: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ── INFO CELL ─────────────────────────────────────────────────────────────────

function InfoCell({
  label,
  value,
  mono = false,
  accent = false,
  colSpan2 = false,
  copyable = false,
  onCopy,
  copied = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  accent?: boolean;
  colSpan2?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className={`border border-slate-200/80 p-3.5 rounded-xl space-y-1 ${colSpan2 ? 'sm:col-span-2' : ''}`}>
      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold block leading-snug ${mono ? 'font-mono' : ''} ${accent ? 'text-[#145BFF]' : 'text-slate-800'}`}>
          {value || '--'}
        </span>
        {copyable && onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0"
          >
            {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, iconClass = 'text-slate-400' }: { icon: any; title: string; iconClass?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
      <Icon size={15} className={iconClass} />
      <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">{title}</h2>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AdminRechargeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rechargeId = params.id as string;

  const { user: currentAdmin } = useAuthStore();
  const { data: recharge, isLoading, isError, refetch } = useAdminRechargeDetails(rechargeId);
  const startReviewMutation = useStartReview();
  const approveMutation = useApproveRecharge();
  const rejectMutation = useRejectRecharge();

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Approve form
  const [paymentDate, setPaymentDate] = useState('');
  const [receivingAccountId, setReceivingAccountId] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');

  // Reject form
  const [rejectionReason, setRejectionReason] = useState('');

  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Timeline sort
  const [timelineSortOrder, setTimelineSortOrder] = useState<'asc' | 'desc'>('desc');

  // Proof viewer
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [isProofViewerOpen, setIsProofViewerOpen] = useState(false);

  // ── FR-4.20 Interactive verification checklist ─────────────────────────────
  const CHECKLIST_ITEMS = [
    { key: 'utrExists', label: 'UTR exists in bank records' },
    { key: 'paymentSuccessful', label: 'Payment status is Successful' },
    { key: 'amountMatches', label: 'Amount matches exactly' },
    { key: 'receivingAccountMatches', label: 'Receiving account matches' },
    { key: 'paymentTimeReasonable', label: 'Payment time is reasonable' },
    { key: 'utrNotUsedBefore', label: 'UTR not used in any earlier recharge' },
    { key: 'notAlreadyCredited', label: 'This recharge is NOT already credited' },
    { key: 'ledgerCreditAbsent', label: 'No existing ledger credit for this recharge' },
  ];
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const allChecked = CHECKLIST_ITEMS.every((i) => checklist[i.key]);
  const checkedCount = CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length;

  // Default payment date on load
  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    setPaymentDate(localISOTime);
  }, [rechargeId]);

  // Approve handler
  const handleConfirmApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        rechargeId,
        verifiedAmountPaise: recharge.requestedAmountPaise,
        paymentDate: new Date(paymentDate).toISOString(),
        receivingAccountId,
        adminRemarks: adminRemarks.trim() || null,
      });
      setIsApproveModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Reject handler
  const handleConfirmReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        rechargeId,
        rejectionReason: rejectionReason.trim(),
      });
      setIsRejectModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Start Review handler
  const handleStartReview = async () => {
    try {
      await startReviewMutation.mutateAsync(rechargeId);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // ── LOADING / ERROR STATES ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#145BFF] animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading administrative records...</p>
      </div>
    );
  }

  if (isError || !recharge) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] space-y-4">
        <AlertCircle size={40} className="text-rose-500" />
        <h3 className="font-extrabold text-sm text-slate-800">Record Retrieval Failure</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Please check that this recharge ID exists and you are authenticated with an Admin account.
        </p>
        <button
          onClick={() => router.push('/admin/wallet/recharges')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  // ── DERIVED VALUES ─────────────────────────────────────────────────────────

  const requestedAmount = (recharge.requestedAmountPaise ?? 0) / 100;
  const isPending = recharge.status === 'VERIFICATION_PENDING';
  const isUnderReview = recharge.status === 'UNDER_REVIEW';
  const isCredited = recharge.status === 'BALANCE_CREDITED';
  const isRejected = recharge.status === 'REJECTED';
  const isResolved = isCredited || isRejected;

  const isReviewedByMe = recharge.reviewStartedByAdminId === currentAdmin?.id;
  const isReviewedByOther = recharge.reviewStartedByAdminId && !isReviewedByMe;

  // Get latest UTR from most recent submission
  const latestSubmission = recharge.submissions?.[0];
  const fullUtr = latestSubmission?.utr || null;

  // Get reviewer name from audit logs (FR-4.19 — show who is reviewing)
  const reviewStartedLog = recharge.auditLogs?.find((l: any) => l.action === 'REVIEW_STARTED');
  const reviewerName = reviewStartedLog?.performedByUser?.name || recharge.reviewStartedByAdminId || '--';

  // Get resolver name from audit logs (FR-4.18 — resolved by)
  const resolvedLog = recharge.auditLogs?.find(
    (l: any) => l.action === 'APPROVED' || l.action === 'REJECTED'
  );
  const resolverName = resolvedLog?.performedByUser?.name || recharge.resolvedByAdminId || '--';

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">

      {/* Back Navigation */}
      <div>
        <button
          onClick={() => router.push('/admin/wallet/recharges')}
          className="group flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Admin Queue
        </button>
      </div>

      {/* ── FR-4.19: Under Review Banner ────────────────────────────────────── */}
      {isUnderReview && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
          isReviewedByMe
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        } animate-in fade-in duration-200`}>
          <UserCheck size={18} className="shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            {isReviewedByMe ? (
              <>
                <p className="font-extrabold uppercase tracking-wider">You are currently reviewing this recharge request.</p>
                <p className="font-semibold text-blue-600 opacity-80">
                  You claimed this review at {formatDateTime(recharge.reviewStartedAt)}. Use the Resolution Panel below to approve or reject.
                </p>
              </>
            ) : (
              <>
                <p className="font-extrabold">This recharge is currently under review by another admin.</p>
                {/* FR-4.19 Rule: Another admin should see who is reviewing it */}
                <p className="font-semibold">
                  Reviewer: <strong className="font-black text-slate-900">{reviewerName}</strong>
                  &nbsp;• Started: <strong className="font-black text-slate-900">{formatDateTime(recharge.reviewStartedAt)}</strong>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main Grid: 2/3 left + 1/3 right ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Card 1: Recharge Header ──────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">

            {/* Recharge number + status */}
            <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Recharge Reference</span>
                <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span>{recharge.rechargeNumber}</span>
                  <button
                    onClick={() => handleCopy(recharge.rechargeNumber, 'rchNumber')}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  >
                    {copiedField === 'rchNumber' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={recharge.status} />
              </div>
            </div>

            {/* Amount + Start Review CTA */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-black tracking-wide text-slate-500">Requested Top-Up Amount</span>
                <span className="text-3xl font-black text-slate-900 block tracking-tight tabular-nums">
                  {formatCurrency(requestedAmount)}
                </span>
              </div>

              {/* FR-4.19: Start Review/Reassign action — visible when VERIFICATION_PENDING or UNDER_REVIEW by another admin */}
              {(isPending || (isUnderReview && isReviewedByOther)) && (
                <button
                  onClick={handleStartReview}
                  disabled={startReviewMutation.isPending}
                  className={`px-5 py-2.5 ${
                    isReviewedByOther 
                      ? 'bg-amber-600 hover:bg-amber-500 disabled:bg-amber-500/50' 
                      : 'bg-[#145BFF] hover:bg-[#145BFF]/90 disabled:bg-[#145BFF]/50'
                  } text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center gap-2`}
                >
                  {startReviewMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  {isReviewedByOther ? 'Reassign to Me' : 'Start Review / Claim'}
                </button>
              )}
            </div>

            {/* ── FR-4.18: Full UTR prominent display ─────────────────────── */}
            {fullUtr && (
              <div className="border border-blue-100 bg-blue-50/40 p-4 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-blue-500 block tracking-widest">Latest UTR Reference (Full)</span>
                  <span className="text-sm font-black text-slate-900 font-mono tracking-[0.1em] select-all">{fullUtr}</span>
                  <span className="text-[10px] text-slate-400 font-semibold block">From Submission #{latestSubmission?.submissionNumber}</span>
                </div>
                <button
                  onClick={() => handleCopy(fullUtr, 'fullUtr')}
                  className="p-2.5 bg-white hover:bg-blue-100 text-blue-500 rounded-xl border border-blue-200 transition-colors shrink-0"
                >
                  {copiedField === 'fullUtr' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            )}

            {/* ── FR-4.18: User Information ─────────────────────────────── */}
            <div className="space-y-3">
              <SectionHeader icon={User} title="User Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCell label="Full Name" value={recharge.user?.name} />
                <InfoCell label="Mobile Number" value={recharge.user?.mobile} />
                <InfoCell label="Email Address" value={recharge.user?.email} />
                <InfoCell label="User Type" value={recharge.user?.userType || 'N/A'} />
                <InfoCell label="User ID" value={recharge.user?.id} mono />
                <InfoCell label="Account Created" value={formatDateTime(recharge.user?.createdAt)} />
              </div>
            </div>

            {/* ── FR-4.18: Recharge Information ────────────────────────── */}
            <div className="space-y-3">
              <SectionHeader icon={FileText} title="Recharge Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCell
                  label="Recharge Number"
                  value={recharge.rechargeNumber}
                  mono
                  copyable
                  onCopy={() => handleCopy(recharge.rechargeNumber, 'rch2')}
                  copied={copiedField === 'rch2'}
                />
                <InfoCell label="Requested Amount" value={formatCurrency(requestedAmount)} accent />
                <InfoCell label="Status" value={<StatusBadge status={recharge.status} />} />
                <InfoCell label="Created Time" value={formatDateTime(recharge.createdAt)} />
                <InfoCell label="Submitted At" value={formatDateTime(recharge.submittedAt)} />
                <InfoCell label="Resubmission Count" value={String(recharge.resubmissionCount ?? 0)} />
              </div>
            </div>

            {/* ── FR-4.18: UPI Account & Payment Info ──────────────────── */}
            <div className="space-y-3">
              <SectionHeader icon={Wallet} title="UPI Merchant Account & Payment Info" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCell label="UPI Account ID" value={recharge.upiAccountId} mono />
                <InfoCell label="UPI VPA Snapshot" value={recharge.upiVpaSnapshot} mono />
                {/* FR-4.18: Payee snapshot — previously missing */}
                <InfoCell label="Payee Name Snapshot" value={recharge.payeeNameSnapshot} />
                <InfoCell label="Payment Expiry" value={formatDateTime(recharge.paymentExpiresAt)} />
                <div className="sm:col-span-2 border border-blue-100 bg-blue-50/30 p-3.5 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Payment Note / Required Remarks</span>
                    <span className="text-xs font-black text-[#145BFF] font-mono">{recharge.paymentNote || '--'}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(recharge.paymentNote || '', 'payNote')}
                    className="p-2 bg-white hover:bg-blue-100 text-blue-500 rounded-lg border border-blue-200 transition-colors shrink-0"
                  >
                    {copiedField === 'payNote' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ── Card 2: FR-4.18 Review Information ───────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <SectionHeader icon={ShieldCheck} title="Review Information" iconClass="text-blue-500" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Review Start fields — always visible if started */}
              <InfoCell
                label="Review Started By"
                value={recharge.reviewStartedByAdminId ? reviewerName : 'Not yet started'}
              />
              <InfoCell
                label="Review Started Time"
                value={formatDateTime(recharge.reviewStartedAt)}
              />

              {/* Resolution fields — always visible if resolved */}
              <InfoCell
                label="Resolved By"
                value={recharge.resolvedByAdminId ? resolverName : 'Not yet resolved'}
              />
              <InfoCell
                label="Resolved Time"
                value={formatDateTime(recharge.resolvedAt)}
              />

              {/* Approval-specific fields */}
              {isCredited && (
                <>
                  <InfoCell
                    label="Verified Amount"
                    value={recharge.verifiedAmountPaise ? formatCurrency(recharge.verifiedAmountPaise / 100) : '--'}
                    accent
                  />
                  <InfoCell
                    label="Payment Date (Confirmed)"
                    value={formatDateTime(recharge.paymentDate)}
                  />
                  <InfoCell
                    label="Receiving Account ID"
                    value={recharge.receivingAccountId}
                    mono
                    copyable
                    onCopy={() => handleCopy(recharge.receivingAccountId || '', 'rcvAcc')}
                    copied={copiedField === 'rcvAcc'}
                  />
                  <InfoCell
                    label="Wallet Credited At"
                    value={formatDateTime(recharge.creditedAt)}
                  />
                  <InfoCell
                    label="Admin Remarks"
                    value={recharge.adminRemarks || 'No remarks provided.'}
                    colSpan2
                  />
                </>
              )}

              {/* Rejection reason — always visible if rejected */}
              {isRejected && (
                <div className="sm:col-span-2 border border-rose-200 bg-rose-50/30 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-rose-500 block tracking-widest">Rejection Reason</span>
                  <p className="text-xs font-bold text-rose-700 leading-relaxed whitespace-pre-wrap">
                    {recharge.rejectionReason || 'No rejection reason provided.'}
                  </p>
                </div>
              )}

              {/* Show pending state info */}
              {!isResolved && !isUnderReview && isPending && (
                <div className="sm:col-span-2 border border-amber-200 bg-amber-50/30 p-3.5 rounded-xl">
                  <p className="text-xs font-bold text-amber-700">
                    This recharge is awaiting admin review. Start review to claim ownership and process this request.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Card 3: Resolution Action Panel (FR-4.19, FR-4.20) ────────────── */}
          {isUnderReview && isReviewedByMe && (
            <div className="bg-white rounded-3xl border-2 border-[#145BFF]/20 shadow-sm p-6 space-y-5 animate-in slide-in-from-bottom duration-300">
              <SectionHeader icon={ShieldCheck} title="Resolution Action Panel" iconClass="text-[#145BFF]" />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold">
                ⚠ You have claimed this review. Verify all bank records before taking action. This action is permanent.
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Verified Amount (read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Verified Amount (INR)
                    </label>
                    <input
                      type="number"
                      value={requestedAmount}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Payment Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#145BFF] focus:ring-1 focus:ring-[#145BFF]/20 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-none"
                      required
                    />
                  </div>

                  {/* Receiving Account ID */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Receiving Account ID / Bank Account / UPI Ref <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={receivingAccountId}
                      onChange={(e) => setReceivingAccountId(e.target.value)}
                      placeholder="e.g. UPI-HDFC-9921, HDFC-XXXX1234, etc."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#145BFF] focus:ring-1 focus:ring-[#145BFF]/20 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-none"
                      required
                    />
                  </div>

                  {/* Admin Remarks */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Admin Internal Remarks (Optional)
                    </label>
                    <textarea
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      placeholder="Add any internal verification remarks, references, or context..."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#145BFF] focus:ring-1 focus:ring-[#145BFF]/20 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-5 py-2.5 bg-white border border-rose-200 hover:border-rose-400 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98]"
                  >
                    Reject Verification
                  </button>
                  <button
                    type="button"
                    disabled={!allChecked}
                    onClick={() => {
                      if (!paymentDate || !receivingAccountId.trim()) {
                        alert('Please fill in all required fields (Payment Date and Receiving Account ID).');
                        return;
                      }
                      setIsApproveModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#145BFF] hover:bg-[#145BFF]/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-[0.98] transition-all"
                    title={!allChecked ? 'Complete all checklist items on the right before approving' : undefined}
                  >
                    Approve &amp; Credit Wallet
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Card 4: Verification Submissions (FR-4.18) ───────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <SectionHeader icon={Hash} title="Payment Verification Submissions" />

            {!recharge.submissions || recharge.submissions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-semibold text-xs italic">
                No verification submissions have been received yet.
              </div>
            ) : (
              <div className="space-y-4">
                {recharge.submissions.map((sub: any) => (
                  <div key={sub.id} className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50/30">

                    {/* Submission header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        Submission #{sub.submissionNumber}
                      </span>
                      <StatusBadge status={sub.status} />
                      {sub.proofStoragePath && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wide">
                          Screenshot Attached
                        </span>
                      )}
                    </div>

                    {/* Full UTR — admin always sees unmasked */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2.5 rounded-xl">
                      <Hash size={12} className="text-slate-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">UTR:</span>
                      <span className="text-xs font-black text-slate-900 font-mono tracking-[0.12em] select-all flex-1">
                        {sub.utr}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(sub.utr, `utr-${sub.id}`)}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0"
                      >
                        {copiedField === `utr-${sub.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Submission metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500">
                      <div>
                        <span className="text-slate-400">Submitted By: </span>
                        <span className="font-bold text-slate-700">
                          {sub.submittedByUser?.name || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Submitted At: </span>
                        <span className="font-bold text-slate-700">{formatDateTime(sub.submittedAt)}</span>
                      </div>
                      {sub.adminRemarks && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-400">Admin Remarks: </span>
                          <span className="font-bold text-slate-700">{sub.adminRemarks}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment proof viewer */}
                    {sub.proofStoragePath ? (
                      <button
                        onClick={() => { setSelectedSubId(sub.id); setIsProofViewerOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-[#145BFF] text-slate-700 hover:text-[#145BFF] rounded-xl text-[10px] font-black uppercase transition-all shadow-sm"
                      >
                        <Eye size={12} />
                        View Payment Proof Screenshot
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-wide">
                        No Screenshot Uploaded
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── FR-4.20: Admin Verification Checklist ──────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <SectionHeader icon={ShieldCheck} title="Verification Checklist" iconClass="text-[#145BFF]" />

            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Verify each item against actual bank records.{' '}
              <strong className="text-rose-500">All must be checked to unlock Approve.</strong>
            </p>

            <div className="space-y-2.5 text-xs font-semibold">
              {CHECKLIST_ITEMS.map((item) => (
                <label key={item.key} className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!checklist[item.key]}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="mt-0.5 rounded border-slate-300 text-[#145BFF] focus:ring-[#145BFF] cursor-pointer shrink-0"
                  />
                  <span className={`transition-colors leading-snug ${checklist[item.key] ? 'text-emerald-600 line-through' : 'text-slate-650 group-hover:text-slate-800'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Progress</span>
                <span className={allChecked ? 'text-emerald-600' : ''}>
                  {checkedCount} / {CHECKLIST_ITEMS.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${allChecked ? 'bg-emerald-500' : 'bg-[#145BFF]'}`}
                  style={{ width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%` }}
                />
              </div>
              {!allChecked && (
                <p className="text-[10px] text-amber-600 font-bold">
                  Complete all {CHECKLIST_ITEMS.length - checkedCount} remaining items to unlock Approve.
                </p>
              )}
              {allChecked && (
                <p className="text-[10px] text-emerald-600 font-bold">✓ All checks complete. Approve is now unlocked.</p>
              )}
            </div>
          </div>

          {/* ── Timelines Sidebar ──────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <SectionHeader icon={Calendar} title="Top-up Timelines" />
            <div className="text-[11px] space-y-3 font-semibold text-slate-600">
              {[
                { label: 'Created', value: formatDateTime(recharge.createdAt) },
                { label: 'Payment Expiry', value: formatDateTime(recharge.paymentExpiresAt) },
                { label: 'UTR Grace Deadline', value: formatDateTime(recharge.utrSubmissionDeadline) },
                { label: 'Submitted At', value: formatDateTime(recharge.submittedAt) },
                { label: 'Review Started', value: formatDateTime(recharge.reviewStartedAt) },
                { label: 'Resolved At', value: formatDateTime(recharge.resolvedAt) },
                { label: 'Credited At', value: formatDateTime(recharge.creditedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">{label}</span>
                  <span className="text-slate-800 tabular-nums text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Audit Logs Timeline ────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Audit Log Timeline</h3>
              <select
                value={timelineSortOrder}
                onChange={(e) => setTimelineSortOrder(e.target.value as 'asc' | 'desc')}
                className="bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold px-2 py-1 outline-none cursor-pointer focus:border-[#145BFF]"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            {(!recharge.auditLogs || recharge.auditLogs.length === 0) ? (
              <p className="text-xs text-slate-400 font-semibold italic text-center py-4">No audit events recorded yet.</p>
            ) : (
              <div className="relative pl-4 border-l border-slate-200 space-y-5 ml-1">
                {[...(recharge.auditLogs || [])].sort((a, b) => {
                  const tA = new Date(a.createdAt).getTime();
                  const tB = new Date(b.createdAt).getTime();
                  return timelineSortOrder === 'desc' ? tB - tA : tA - tB;
                }).map((log: any) => (
                  <div key={log.id} className="relative">
                    <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                      log.action === 'APPROVED' ? 'bg-emerald-500' :
                      log.action === 'REJECTED' ? 'bg-rose-500' :
                      log.action === 'REVIEW_STARTED' ? 'bg-blue-500' :
                      log.action === 'VERIFICATION_SUBMITTED' ? 'bg-amber-400' :
                      'bg-slate-400'
                    }`} />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-800 block">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.remarks && (
                        <span className="text-[11px] text-slate-500 block leading-tight font-semibold">
                          {log.remarks}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold font-mono">
                        <span>{log.performedByUser?.name || 'SYSTEM'}</span>
                        <span>•</span>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Proof Viewer Modal ─────────────────────────────────────────────── */}
      {isProofViewerOpen && selectedSubId && (
        <ProofViewer
          rechargeId={rechargeId}
          submissionId={selectedSubId}
          onClose={() => { setIsProofViewerOpen(false); setSelectedSubId(null); }}
        />
      )}

      {/* ── Approve Confirmation Modal — FR-4.22 ────────────────────────── */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-5 animate-in zoom-in duration-150">

            {/* FR-4.22: Header */}
            <div className="flex items-center gap-3 text-emerald-600">
              <AlertTriangle size={22} className="shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider">Confirm Wallet Credit</h3>
            </div>

            {/* FR-4.22: Confirmation sentence exactly as spec */}
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              You are about to credit{' '}
              <strong className="text-emerald-700 font-black">{formatCurrency(requestedAmount)}</strong>{' '}
              to{' '}
              <strong className="font-black">{recharge.user?.name}</strong>'s wallet.
            </p>

            {/* FR-4.22: Summary table with masked UTR */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-[11px] font-semibold">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Recharge</span>
                <span className="text-slate-800 font-black font-mono">{recharge.rechargeNumber}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Amount</span>
                <span className="text-emerald-700 font-black">{formatCurrency(requestedAmount)}</span>
              </div>
              {/* FR-4.22: UTR shown masked — e.g. ********9012 */}
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">UTR</span>
                <span className="text-slate-800 font-mono tracking-wider">
                  {fullUtr
                    ? '*'.repeat(Math.max(0, fullUtr.length - 4)) + fullUtr.slice(-4)
                    : '--'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Receiving Account</span>
                <span className="text-slate-800 text-right font-mono">{receivingAccountId}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Payment Date</span>
                <span className="text-slate-800 font-mono">{paymentDate}</span>
              </div>
            </div>

            {/* FR-4.22: Warning — cannot be automatically reversed */}
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5">
              <Info size={15} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-relaxed">
                <strong>This action cannot be automatically reversed.</strong> It credits real wallet balance. Verify all bank records before proceeding.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                disabled={approveMutation.isPending}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approveMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                {approveMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm Approval &amp; Credit Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Confirmation Modal — FR-4.24 ──────────────────────────── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle size={22} className="shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider">Reject Verification Request</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Specify a clear rejection reason for{' '}
              <strong className="text-slate-900">{recharge.user?.name}</strong>'s payment verification.
              The user will see this reason and may resubmit with corrections.
            </p>

            {/* FR-4.24: Quick-select rejection reason examples from PRD */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Select Reason</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'UTR not found in bank records',
                  'Duplicate UTR — already used',
                  'Amount mismatch',
                  'Wrong receiving account',
                  'Payment failed or reversed',
                  'Payment details incorrect',
                  'Screenshot unclear or unreadable',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                      rejectionReason === preset
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400 hover:bg-rose-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom reason textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Rejection Reason <span className="text-rose-500">* (Min 10 characters)</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Select a preset above or write a custom reason..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 rounded-xl text-xs font-semibold text-slate-800 transition-all outline-none resize-none"
                required
              />
              {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
                <span className="text-[10px] text-rose-500 font-bold block">
                  {10 - rejectionReason.trim().length} more characters required.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setIsRejectModalOpen(false); }}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || rejectionReason.trim().length < 10}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                {rejectMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── PROOF VIEWER COMPONENT ────────────────────────────────────────────────────

function ProofViewer({
  rechargeId,
  submissionId,
  onClose,
}: {
  rechargeId: string;
  submissionId: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useAdminProofUrl(rechargeId, submissionId, true);

  const handleDownload = () => {
    if (!data?.signedUrl) return;
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = `proof-${submissionId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in duration-150">

        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Eye size={15} />
            <span className="text-xs font-extrabold uppercase tracking-wider">Payment Proof Screenshot</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Image body */}
        <div className="p-6 overflow-y-auto flex-grow flex flex-col items-center justify-center bg-slate-50 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#145BFF]" />
              <p className="text-xs font-bold text-slate-500">Generating signed temporary access link...</p>
            </div>
          ) : isError || !data?.signedUrl ? (
            <div className="flex flex-col items-center gap-2 text-rose-600 text-center">
              <AlertTriangle size={36} />
              <p className="text-xs font-black uppercase tracking-wider">Failed to generate signed URL</p>
              <p className="text-[11px] text-slate-500 font-semibold max-w-xs mt-1">
                The URL may have expired or the file may have been removed.
              </p>
            </div>
          ) : (
            <img
              src={data.signedUrl}
              alt="Payment verification screenshot"
              className="max-h-[55vh] max-w-full rounded-2xl object-contain border border-slate-200 shadow-md bg-white"
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
          {data?.signedUrl && (
            <>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <Download size={13} />
                Download
              </button>
              <a
                href={data.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#145BFF] hover:bg-[#145BFF]/90 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <ExternalLink size={13} />
                Open Tab
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
