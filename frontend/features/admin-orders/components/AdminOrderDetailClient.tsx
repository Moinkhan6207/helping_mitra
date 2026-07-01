'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/authStore';
import axiosClient from '@/lib/axios';
import { useAdminsList } from '../hooks/useAdminOrders';
import {
  useAdminOrderDetail,
  useRevealFieldMutation,
  useFileAccessMutation,
  useOrderInternalNotes,
  useAddOrderNoteMutation,
  useOrderResultDraft,
  useSaveResultDraftMutation,
  useValidateResultMutation,
  useUploadResultFileMutation,
  useGetResultFileAccessMutation,
  useCompleteOrderMutation,
  useCompletionSummary,
  useRejectOrderMutation,
} from '../hooks/useAdminOrderDetail';
import { NoteType } from '../types';
import {
  useAssignOrderMutation,
  useClaimOrderMutation,
  useReassignOrderMutation,
  useStartProcessingMutation,
} from '../hooks/useOrderProcessing';
import {
  ArrowLeft,
  User,
  ShoppingBag,
  Lock,
  Unlock,
  Eye,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  Image as ImageIcon,
  Shield,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserPlus,
  Play,
  Users,
  ChevronLeft,
  MessageSquare,
  Send,
  Search,
  Upload,
  X,
  File,
  Sparkles,
  Printer,
} from 'lucide-react';

interface Props {
  orderId: string;
}

export const AdminOrderDetailClient: React.FC<Props> = ({ orderId }) => {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { data: order, isLoading, error, refetch } = useAdminOrderDetail(orderId);
  const { data: admins = [] } = useAdminsList();

  // Mutations
  const revealMutation = useRevealFieldMutation(orderId);
  const fileAccessMutation = useFileAccessMutation(orderId);
  const assignMutation = useAssignOrderMutation(orderId);
  const claimMutation = useClaimOrderMutation(orderId);
  const reassignMutation = useReassignOrderMutation(orderId);
  const startProcessingMutation = useStartProcessingMutation(orderId);

  // States
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [selectedFieldLabel, setSelectedFieldLabel] = useState<string | null>(null);
  const [revealReason, setRevealReason] = useState('');
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});

  // Document preview state
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  // Loading indicator for files (by document ID)
  const [fileLoadingId, setFileLoadingId] = useState<string | null>(null);

  // Assignment Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [isReassignment, setIsReassignment] = useState(false);
  const [reassignReason, setReassignReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Notes Filters State
  const [notesPage, setNotesPage] = useState(1);
  const [notesSearchInput, setNotesSearchInput] = useState('');
  const [notesSearch, setNotesSearch] = useState('');
  const [notesTypeFilter, setNotesTypeFilter] = useState('');
  const [notesAuthorFilter, setNotesAuthorFilter] = useState('');
  const [notesStartDate, setNotesStartDate] = useState('');
  const [notesEndDate, setNotesEndDate] = useState('');
  
  // New Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('GENERAL');
  const [noteSubmitError, setNoteSubmitError] = useState<string | null>(null);

  // Result preparation states
  const { data: resultDraftData } = useOrderResultDraft(orderId, order?.orderStatus === 'PROCESSING');
  const saveResultDraftMutation = useSaveResultDraftMutation(orderId);
  const validateResultMutation = useValidateResultMutation(orderId);
  const uploadResultFileMutation = useUploadResultFileMutation(orderId);
  const getResultFileAccessMutation = useGetResultFileAccessMutation(orderId);
  const completeOrderMutation = useCompleteOrderMutation(orderId);
  const { data: completionSummary } = useCompletionSummary(orderId, order?.orderStatus === 'SUCCESS');

  // Initialize state from draft data
  const draftInitialState = React.useMemo(() => {
    if (resultDraftData?.draft) {
      return {
        textValue: resultDraftData.draft.textValue || '',
        fileName: resultDraftData.draft.fileName || '',
        fileType: resultDraftData.draft.fileType || '',
        fileSize: resultDraftData.draft.fileSize || null,
        storagePath: resultDraftData.draft.storagePath || '',
        internalCompletionNote: resultDraftData.draft.internalCompletionNote || '',
        userVisibleCompletionNote: resultDraftData.draft.userVisibleCompletionNote || '',
      };
    }
    return null;
  }, [resultDraftData]);

  const [resultText, setResultText] = useState(draftInitialState?.textValue || '');
  const [resultFileName, setResultFileName] = useState(draftInitialState?.fileName || '');
  const [resultFileType, setResultFileType] = useState(draftInitialState?.fileType || '');
  const [resultFileSize, setResultFileSize] = useState<number | null>(draftInitialState?.fileSize || null);
  const [resultStoragePath, setResultStoragePath] = useState(draftInitialState?.storagePath || '');
  const [internalCompletionNote, setInternalCompletionNote] = useState(draftInitialState?.internalCompletionNote || '');
  const [userVisibleCompletionNote, setUserVisibleCompletionNote] = useState(draftInitialState?.userVisibleCompletionNote || '');
  const [resultActionError, setResultActionError] = useState<string | null>(null);
  const [resultActionSuccess, setResultActionSuccess] = useState<string | null>(null);
  const [resultValidationErrors, setResultValidationErrors] = useState<string[]>([]);
  const [resultValidatedSuccessfully, setResultValidatedSuccessfully] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const isUploadingResult = uploadResultFileMutation.isPending || isUploadingFile;

  const handleResultFileUpload = async (file: File) => {
    setFileUploadError(null);
    setResultActionError(null);
    setIsUploadingFile(true);

    try {
      const uploadSessionId = uuidv4();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadSessionId', uploadSessionId);
      formData.append('documentKey', 'order-results');

      const response = await axiosClient.post('/uploads/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { storagePath } = response.data.data;

      // Upload succeeded, now call backend mutation
      const resp = await uploadResultFileMutation.mutateAsync({
        storagePath,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });

      setResultFileName(resp.fileName);
      setResultFileType(resp.fileType);
      setResultFileSize(resp.fileSize);
      setResultStoragePath(resp.storagePath);
      setResultValidatedSuccessfully(false);
      setResultValidationErrors([]);
      setResultActionSuccess(resp.isReplacement ? 'File replaced successfully.' : 'File uploaded successfully.');
    } catch (err: any) {
      console.error('File upload process failed:', err);
      const errorMessage = err?.message || 'File upload failed. Check file type and size.';
      setFileUploadError(errorMessage);
    } finally {
      setIsUploadingFile(false);
    }
  };
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  // Completion confirmation modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  // Rejection modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [refundOption, setRefundOption] = useState<'FULL_REFUND' | 'NO_REFUND'>('FULL_REFUND'); // Always refund
  const [internalRejectionReason, setInternalRejectionReason] = useState('');
  const [userVisibleRejectionReason, setUserVisibleRejectionReason] = useState('');
  const [noRefundReason, setNoRefundReason] = useState('');
  const [refundConfirmModalOpen, setRefundConfirmModalOpen] = useState(false);
  const [concurrencyErrorModalOpen, setConcurrencyErrorModalOpen] = useState(false);
  const rejectMutation = useRejectOrderMutation(orderId);

  // Sync state when draft data changes
  useEffect(() => {
    if (draftInitialState) {
      setResultText(draftInitialState.textValue);
      setResultFileName(draftInitialState.fileName);
      setResultFileType(draftInitialState.fileType);
      setResultFileSize(draftInitialState.fileSize);
      setResultStoragePath(draftInitialState.storagePath);
      setInternalCompletionNote(draftInitialState.internalCompletionNote);
      setUserVisibleCompletionNote(draftInitialState.userVisibleCompletionNote);
    }
  }, [draftInitialState]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setNotesSearch(notesSearchInput);
      setNotesPage(1); // reset to page 1
    }, 400);
    return () => clearTimeout(handler);
  }, [notesSearchInput]);

  const { data: notesData, isLoading: notesLoading } = useOrderInternalNotes(orderId, {
    page: notesPage,
    limit: 20,
    search: notesSearch || undefined,
    noteType: notesTypeFilter || undefined,
    authorId: notesAuthorFilter || undefined,
    startDate: notesStartDate || undefined,
    endDate: notesEndDate || undefined,
  });

  const addNoteMutation = useAddOrderNoteMutation(orderId);

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteSubmitError(null);

    const note = newNoteText.trim();
    if (note.length === 0) {
      setNoteSubmitError('Note content cannot be empty.');
      return;
    }

    try {
      await addNoteMutation.mutateAsync({
        note,
        noteType: newNoteType,
      });
      setNewNoteText('');
      setNewNoteType('GENERAL');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add internal note.';
      setNoteSubmitError(errorMessage);
    }
  };

  const highlightText = (text: string, search: string) => {
    if (!search || !search.trim()) return text;
    
    try {
      const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
      return (
        <span>
          {parts.map((part, index) => 
            part.toLowerCase() === search.toLowerCase() ? (
              <mark key={index} className="bg-yellow-100 text-slate-900 rounded-xs px-0.5 font-bold">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    } catch {
      return text;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-white border border-slate-150 rounded-2xl shadow-xs text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500">
          <XCircle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
          <p className="text-sm text-slate-500">
            The order with ID <span className="font-mono bg-slate-50 px-1 rounded text-red-600">{orderId}</span> does not exist or you do not have permission to view it.
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/orders')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition"
        >
          <ArrowLeft size={16} /> Back to Order Queue
        </button>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.email === 'admin@helpingmitra.com';
  const isAssignedToMe = order.assignedAdminId === currentUser?.id;
  const isPending = order.orderStatus === 'PENDING';
  const isProcessing = order.orderStatus === 'PROCESSING';

  // Handle sensitive reveal request
  const handleRevealClick = (fieldKey: string, fieldLabel: string) => {
    setSelectedFieldKey(fieldKey);
    setSelectedFieldLabel(fieldLabel);
    setRevealReason('');
    setRevealError(null);
    setRevealModalOpen(true);
  };

  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldKey) return;
    if (revealReason.trim().length < 5) {
      setRevealError('Please provide a descriptive reason (at least 5 characters).');
      return;
    }

    try {
      const result = await revealMutation.mutateAsync({
        fieldKey: selectedFieldKey,
        reason: revealReason,
      });
      setRevealedValues((prev) => ({
        ...prev,
        [selectedFieldKey]: result.fieldValue,
      }));
      setRevealModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reveal sensitive field. Access Denied.';
      setRevealError(errorMessage);
    }
  };
  // Handle document view or download on-demand
  const handleFileAccess = async (fileId: string, fileName: string, fileType: string, action: 'VIEW' | 'DOWNLOAD') => {
    setFileLoadingId(fileId);
    try {
      const response = await fileAccessMutation.mutateAsync({ fileId, action });
      const signedUrl = response.signedUrl;

      if (action === 'VIEW') {
        setPreviewFile({
          url: signedUrl,
          name: fileName,
          type: fileType,
        });
      } else {
        // Use standard browser download flow. Since backend configures Content-Disposition response headers
        // on GCS signed URLs, browser will directly download file locally without CORS issue.
        const link = document.createElement('a');
        link.href = signedUrl;
        link.setAttribute('download', fileName);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Access failed. You may not have permission to retrieve this file.';
      alert(errorMessage);
    } finally {
      setFileLoadingId(null);
    }
  };  // Handle claim order
  const handleClaimOrder = async () => {
    setActionError(null);
    try {
      await claimMutation.mutateAsync({
        version: order.version,
        idempotencyKey: uuidv4(),
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim order.';
      setActionError(errorMessage);
    }
  };

  // Handle start processing
  const handleStartProcessing = async () => {
    setActionError(null);
    try {
      await startProcessingMutation.mutateAsync({
        version: order.version,
        idempotencyKey: uuidv4(),
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start processing order.';
      setActionError(errorMessage);
    }
  };

  // Handle open Assign Modal
  const handleOpenAssignModal = (reassign: boolean) => {
    setIsReassignment(reassign);
    setSelectedAssigneeId(reassign ? order.assignedAdminId || '' : '');
    setReassignReason('');
    setActionError(null);
    setAssignModalOpen(true);
  };

  // Handle Assign/Reassign Submit
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!selectedAssigneeId) {
      setActionError('Please select an administrator.');
      return;
    }
    if (isReassignment && !reassignReason.trim()) {
      setActionError('Please enter a reassignment reason.');
      return;
    }

    try {
      if (isReassignment) {
        await reassignMutation.mutateAsync({
          assignedAdminId: selectedAssigneeId,
          reason: reassignReason,
          version: order.version,
        });
      } else {
        await assignMutation.mutateAsync({
          assignedAdminId: selectedAssigneeId,
          version: order.version,
        });
      }
      setAssignModalOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed. Concurrency control error.';
      setActionError(errorMessage);
    }
  };

  // Helper to format timestamps
  const formatDateTime = (dateStr: string | Date | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Status color mapper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formattedAmount = typeof order.orderAmount === 'number'
    ? order.orderAmount
    : Number(order.orderAmount) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── Header / Breadcrumb ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Link href="/admin/orders" className="hover:text-blue-600 transition">
              Order Queue
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-400 font-mono">#{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Order: <span className="font-mono text-slate-700">{order.orderNumber}</span>
            </h1>
            <span className={`px-3 py-1 border text-xs font-bold rounded-full uppercase tracking-wider ${getStatusBadgeClass(order.orderStatus)}`}>
              {order.orderStatus}
            </span>
          </div>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-xs transition active:scale-[0.98] self-start md:self-auto"
        >
          <ArrowLeft size={14} /> Back to Queue
        </Link>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-250 rounded-2xl flex items-start gap-3 text-xs text-rose-700 animate-in slide-in-from-top-4 duration-200">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Workflow Validation Mismatch</p>
            <p className="text-[11px] leading-relaxed">{actionError}</p>
            {actionError.includes('updated') && (
              <button
                onClick={() => { setActionError(null); refetch(); }}
                className="mt-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-2 py-1 rounded transition text-[10px]"
              >
                Refresh Order State
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Grid Layout: Info Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Details */}
        <div className="bg-white border border-slate-155 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
            <User size={16} className="text-blue-600" />
            <h2>User Account Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">User Name</p>
              <p className="font-semibold text-slate-800 mt-0.5">{order.user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">User ID</p>
              <p className="font-mono text-slate-700 mt-0.5 break-all">{order.user?.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Email Address</p>
              <p className="font-semibold text-slate-800 mt-0.5 break-all">{order.user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Mobile Number</p>
              <p className="font-semibold text-slate-800 mt-0.5">{order.user?.mobile || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">User Type</p>
              <span className={`inline-block font-black text-[9px] px-2 py-0.5 border rounded uppercase mt-1 ${order.user?.userType === 'RETAILER' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                {order.user?.userType || 'N/A'}
              </span>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Account Created</p>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(order.user?.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white border border-slate-155 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
            <ShoppingBag size={16} className="text-blue-600" />
            <h2>Order Context Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Service Name</p>
              <p className="font-semibold text-slate-800 mt-0.5">{order.serviceNameSnapshot}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Service Category</p>
              <p className="font-semibold text-slate-800 mt-0.5">{order.categoryNameSnapshot}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Order Amount</p>
              <p className="font-extrabold text-slate-900 mt-0.5 text-sm">₹{formattedAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Optimistic Version</p>
              <p className="font-semibold text-slate-850 mt-0.5">v{order.version}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Submission Time</p>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Last Status Update</p>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(order.updatedAt)}</p>
            </div>
            {order.resultTypeSnapshot && (
              <div>
                <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Expected Result Type</p>
                <span className="inline-block mt-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                  {order.resultTypeSnapshot} ({order.resultLabelSnapshot})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Claiming & Concurrency processing actions */}
        <div className="bg-white border border-slate-155 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-600" />
                <h2>Assignment & claims control</h2>
              </div>
              <span className={`inline-block font-black text-[9px] px-2 py-0.5 border rounded uppercase ${
                order.assignedAdminId
                  ? isAssignedToMe
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {order.assignedAdminId
                  ? isAssignedToMe
                    ? 'Assigned to you'
                    : 'Assigned to other'
                  : 'Unassigned'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs">
              <div>
                <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Assigned Admin</p>
                <p className="font-semibold text-slate-800 mt-0.5">{order.assignedAdminName}</p>
              </div>
              <div>
                <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Assigned By</p>
                <p className="font-semibold text-slate-800 mt-0.5">{order.assignedByAdminName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Assigned At</p>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(order.assignedAt)}</p>
              </div>
              <div>
                <p className="text-slate-450 uppercase font-black tracking-wider text-[10px]">Processing Started</p>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(order.processingStartedAt)}</p>
              </div>
            </div>
          </div>

          {/* Processing Actions buttons block */}
          <div className="space-y-2.5 pt-2 border-t border-slate-50">
            {/* Start Processing (Visible in Pending Status) */}
            {isPending && (
              <div className="space-y-1">
                <button
                  onClick={handleStartProcessing}
                  disabled={startProcessingMutation.isPending || (!isAssignedToMe && !isSuperAdmin)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-[0.98] disabled:cursor-not-allowed"
                >
                  <Play size={14} /> {startProcessingMutation.isPending ? 'Starting...' : 'Start Processing'}
                </button>
                {!isAssignedToMe && !isSuperAdmin && (
                  <p className="text-[9px] text-slate-400 italic text-center">
                    Only the assigned administrator may start processing.
                  </p>
                )}
              </div>
            )}

            {/* Assignment triggers */}
            {isPending && (
              <div className="grid grid-cols-2 gap-2">
                {!order.assignedAdminId ? (
                  <>
                    <button
                      onClick={handleClaimOrder}
                      disabled={claimMutation.isPending}
                      className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl transition"
                    >
                      <UserCheck size={12} /> Claim Order
                    </button>
                    <button
                      onClick={() => handleOpenAssignModal(false)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl transition shadow-2xs"
                    >
                      <UserPlus size={12} /> Assign Admin
                    </button>
                  </>
                ) : (
                  // Reassign visible to managers/super-admins or if order is in PENDING/PROCESSING
                  (isPending || isProcessing) && (
                    <button
                      onClick={() => handleOpenAssignModal(true)}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl transition"
                    >
                      <Users size={12} /> Reassign Administrator
                    </button>
                  )
                )}
              </div>
            )}
            {(isPending || isProcessing) && (
              <div className="space-y-1 pt-1 border-t border-slate-50">
                <button
                  onClick={() => {
                    setInternalRejectionReason('');
                    setUserVisibleRejectionReason('');
                    setRejectModalOpen(true);
                  }}
                  disabled={!isAssignedToMe && !isSuperAdmin && order.assignedAdminId !== null}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-50 disabled:text-slate-400 text-rose-600 text-xs font-black rounded-xl border border-rose-200 disabled:border-slate-100 shadow-2xs transition active:scale-[0.98] disabled:cursor-not-allowed"
                >
                  <XCircle size={14} /> Reject Order
                </button>
                {!isAssignedToMe && !isSuperAdmin && order.assignedAdminId !== null && (
                  <p className="text-[9px] text-slate-400 italic text-center leading-normal">
                    Only the assigned administrator or a super admin may reject this order.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Submitted Form Section ── */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
          <FileText size={16} className="text-blue-500" />
          <h2>Submitted Form Fields</h2>
        </div>
        
        {order.fieldValues.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No form fields were submitted with this order.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {order.fieldValues
              .filter((fv) => fv.fieldKey !== '_consent_text' && fv.fieldKey !== 'uploads' && fv.fieldKey !== 'userId')
              .map((fv) => {
                const isRevealed = !!revealedValues[fv.fieldKey];
                const displayValue = isRevealed ? revealedValues[fv.fieldKey] : fv.fieldValue;

                return (
                <div
                  key={fv.id}
                  className={`p-4 rounded-xl border transition ${
                    isRevealed
                      ? 'bg-amber-50/30 border-amber-350 shadow-xs'
                      : fv.isSensitive
                      ? 'bg-slate-50/50 border-slate-200'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-450 flex items-center gap-1.5">
                      {fv.fieldLabel}
                      {fv.isSensitive && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] bg-red-50 text-red-600 border border-red-100 px-1 rounded uppercase font-black leading-none">
                          <Lock size={8} /> Sensitive
                        </span>
                      )}
                    </span>
                    {fv.isSensitive && !isRevealed && (
                      <button
                        onClick={() => handleRevealClick(fv.fieldKey, fv.fieldLabel)}
                        className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-black focus:outline-none"
                      >
                        <Unlock size={10} /> Reveal Data
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-800 break-words font-semibold leading-relaxed">
                    {displayValue ? (
                      typeof displayValue === 'object' ? (
                        <pre className="whitespace-pre-wrap font-mono text-[10px] bg-slate-50 p-2 rounded-lg overflow-x-auto">
                          {JSON.stringify(displayValue, null, 2)}
                        </pre>
                      ) : (
                        displayValue
                      )
                    ) : (
                      <span className="text-slate-400 italic font-normal">Empty / Not Provided</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Generated Government Form Section ── */}
      {(() => {
        const govtForm = order.documents.find(doc => doc.documentKey === 'generatedGovernmentForm');
        if (!govtForm) return null;
        return (
          <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 border border-blue-150/70 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-105 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileText size={18} className="text-blue-600 animate-pulse" />
                <h2>Generated Government PAN Form</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded-md uppercase tracking-wider">
                NSDL / Protean Official PDF
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-slate-150 rounded-xl shadow-3xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {govtForm.fileName}
                  </p>
                  <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                    PDF DOCUMENT • {(govtForm.fileSize / 1024).toFixed(1)} KB • Generated on submission
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-auto">
                <button
                  onClick={() => handleFileAccess(govtForm.id, govtForm.fileName, govtForm.fileType, 'VIEW')}
                  disabled={fileLoadingId === govtForm.id}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition active:scale-[0.98] disabled:opacity-50"
                >
                  {fileLoadingId === govtForm.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Eye size={13} />
                  )}
                  Preview PDF
                </button>
                
                <button
                  onClick={() => handleFileAccess(govtForm.id, govtForm.fileName, govtForm.fileType, 'DOWNLOAD')}
                  disabled={fileLoadingId === govtForm.id}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-extrabold rounded-xl text-xs transition active:scale-[0.98] disabled:opacity-50"
                >
                  {fileLoadingId === govtForm.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Download size={13} />
                  )}
                  Download PDF
                </button>

                <button
                  onClick={() => handleFileAccess(govtForm.id, govtForm.fileName, govtForm.fileType, 'VIEW')}
                  disabled={fileLoadingId === govtForm.id}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition active:scale-[0.98] disabled:opacity-50 shadow-sm"
                >
                  <Printer size={13} />
                  Print PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Documents & Attachments Section ── */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
          <ImageIcon size={16} className="text-blue-500" />
          <h2>Uploaded Documents</h2>
        </div>

        {(() => {
          const uploadedDocs = order.documents.filter(doc => doc.documentKey !== 'generatedGovernmentForm');
          if (uploadedDocs.length === 0) {
            return (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <FileText className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-xs text-slate-500 italic">No Documents Uploaded</p>
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedDocs.map((doc) => {
                const formattedSize = doc.fileSize > 1024 * 1024
                  ? `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB`
                  : `${(doc.fileSize / 1024).toFixed(1)} KB`;
                const isImage = doc.fileType.startsWith('image/');
                const isPdf = doc.fileType === 'application/pdf';

                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-150 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                        {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <p className="text-[10px] text-slate-450 mt-0.5">
                          <span className="uppercase font-semibold">{doc.documentKey}</span> • {doc.fileType.split('/')[1]?.toUpperCase()} • {formattedSize}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {/* View Button (Images & PDFs) */}
                      {(isImage || isPdf) && (
                        <button
                          onClick={() => handleFileAccess(doc.id, doc.fileName, doc.fileType, 'VIEW')}
                          disabled={fileLoadingId === doc.id}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition disabled:opacity-50"
                        >
                          {fileLoadingId === doc.id ? (
                            <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Eye size={12} />
                          )}
                          View
                        </button>
                      )}
                      {/* Download Button */}
                      <button
                        onClick={() => handleFileAccess(doc.id, doc.fileName, doc.fileType, 'DOWNLOAD')}
                        disabled={fileLoadingId === doc.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-bold rounded-lg text-[10px] transition disabled:opacity-50"
                      >
                        {fileLoadingId === doc.id ? (
                          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Download size={12} />
                        )}
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── Internal Notes Panel ── */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <MessageSquare size={16} className="text-blue-600" />
            <h2>Internal Processing Notes (Admin Only)</h2>
          </div>
          <span className="inline-flex items-center gap-1 text-[8px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
            <Shield size={10} /> Admin Only
          </span>
        </div>

        {/* Note Creator Form */}
        <form onSubmit={handleNoteSubmit} className="bg-slate-50/50 border border-slate-150/70 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] uppercase font-black tracking-wider text-slate-400">Context/Type</label>
              <select
                value={newNoteType}
                onChange={(e) => setNewNoteType(e.target.value as NoteType)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition"
              >
                <option value="GENERAL">General Note</option>
                <option value="VERIFICATION">Verification Check</option>
                <option value="DOCUMENT">Document Issue</option>
                <option value="FOLLOW_UP">Follow Up Request</option>
                <option value="ESCALATION">Escalation Alert</option>
              </select>
            </div>
            <div className="sm:w-1/3 flex items-end">
              <span className="text-[10px] text-slate-450 font-semibold mb-2">
                Characters: {newNoteText.length} / 5000
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black tracking-wider text-slate-405">Internal Comment / Note</label>
            <textarea
              required
              rows={3}
              maxLength={5000}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Enter administrative note, investigation comments or process updates here... (Immutable append-only entry)"
              className="w-full px-3 py-2.5 bg-white border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition text-slate-805 font-medium"
            />
          </div>

          {noteSubmitError && (
            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
              <XCircle size={12} /> {noteSubmitError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addNoteMutation.isPending || !newNoteText.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-[0.98]"
            >
              {addNoteMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving Note...
                </>
              ) : (
                <>
                  <Send size={12} /> Save Internal Note
                </>
              )}
            </button>
          </div>
        </form>

        {/* Notes Search & Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Note Search */}
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[9px] uppercase font-black tracking-wider text-slate-450">Search Notes</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" size={13} />
              <input
                type="text"
                placeholder="Filter by note content..."
                value={notesSearchInput}
                onChange={(e) => setNotesSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-black tracking-wider text-slate-455">Note Type</label>
            <select
              value={notesTypeFilter}
              onChange={(e) => { setNotesTypeFilter(e.target.value); setNotesPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-semibold focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition"
            >
              <option value="">All Types</option>
              <option value="GENERAL">General</option>
              <option value="VERIFICATION">Verification</option>
              <option value="DOCUMENT">Document</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="ESCALATION">Escalation</option>
            </select>
          </div>

          {/* Author Filter */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-black tracking-wider text-slate-455">Author</label>
            <select
              value={notesAuthorFilter}
              onChange={(e) => { setNotesAuthorFilter(e.target.value); setNotesPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-semibold focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition"
            >
              <option value="">All Authors</option>
              {admins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Range */}
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-black tracking-wider text-slate-455">Created Date Range</label>
            <div className="flex gap-1 items-center">
              <input
                type="date"
                value={notesStartDate}
                onChange={(e) => { setNotesStartDate(e.target.value); setNotesPage(1); }}
                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition"
              />
              <span className="text-[9px] text-slate-400 font-black">to</span>
              <input
                type="date"
                value={notesEndDate}
                onChange={(e) => { setNotesEndDate(e.target.value); setNotesPage(1); }}
                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] focus:ring-1 focus:ring-[#145BFF] focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Notes list */}
        {notesLoading ? (
          <div className="text-center py-6 flex flex-col items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
            <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Loading Notes...</p>
          </div>
        ) : !notesData || notesData.notes.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <MessageSquare className="mx-auto text-slate-300 mb-2" size={20} />
            <p className="text-xs text-slate-500 italic font-bold">No Internal Notes Yet</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Use the form above to add process updates or notes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100 border border-slate-150/70 rounded-xl overflow-hidden bg-white">
              {notesData.notes.map((note) => {
                const badgeClasses = (type: string) => {
                  switch (type) {
                    case 'VERIFICATION':
                      return 'bg-purple-50 text-purple-700 border-purple-200/50';
                    case 'DOCUMENT':
                      return 'bg-blue-50 text-blue-700 border-blue-200/50';
                    case 'FOLLOW_UP':
                      return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
                    case 'ESCALATION':
                      return 'bg-rose-50 text-rose-700 border-rose-200/50';
                    default:
                      return 'bg-slate-100 text-slate-700 border-slate-250';
                  }
                };

                return (
                  <div key={note.id} className="p-4 hover:bg-slate-50/30 transition-colors flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-slate-850">{note.createdByAdmin?.name}</span>
                        <span className="text-[9px] bg-slate-50 border border-slate-150 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black select-none">
                          {note.createdByAdmin?.role === 'SUPER_ADMIN' ? 'Senior Admin' : note.createdByAdmin?.role || 'Admin'}
                        </span>
                        {note.noteType && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-black rounded uppercase border select-none ${badgeClasses(note.noteType)}`}>
                            {note.noteType}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatDateTime(note.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium pl-1 border-l-2 border-slate-100">
                      {highlightText(note.note, notesSearch)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Notes Pagination Controls */}
            {notesData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-1 py-1 text-[11px] text-slate-400 font-bold border-t border-slate-50">
                <div>
                  Notes: {((notesPage - 1) * 20) + 1} - {Math.min(notesPage * 20, notesData.pagination.total)} of {notesData.pagination.total}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNotesPage(prev => Math.max(prev - 1, 1))}
                    disabled={notesPage === 1}
                    className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 rounded-lg transition disabled:cursor-not-allowed select-none"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <span className="text-slate-800">
                    {notesPage} / {notesData.pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotesPage(prev => Math.min(prev + 1, notesData.pagination.totalPages))}
                    disabled={notesPage === notesData.pagination.totalPages}
                    className="p-1.5 border border-slate-205 hover:bg-slate-50 text-slate-700 disabled:opacity-40 rounded-lg transition disabled:cursor-not-allowed select-none"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Rejected Order Summary Panel (REJECTED only) ── */}
      {order.orderStatus === 'REJECTED' && (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-red-150 pb-3">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <XCircle size={18} className="text-red-500" />
              <h2>Order Rejected</h2>
            </div>
            <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
              REJECTED
            </span>
          </div>

          {/* Rejection metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-red-750 mb-1">Rejected At</p>
              <p className="font-bold text-slate-800">{formatDateTime(order.rejectedAt)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-red-750 mb-1">Rejected By</p>
              <p className="font-bold text-slate-800">{order.rejectedByAdminName || 'Admin'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-red-750 mb-1">Refund Status</p>
              <span className={`inline-block font-extrabold text-[10px] px-2 py-0.5 border rounded bg-white uppercase ${
                order.refundStatus === 'COMPLETED'
                  ? 'border-emerald-200 text-emerald-700'
                  : 'border-slate-200 text-slate-500'
              }`}>
                {order.refundStatus || 'N/A'}
              </span>
            </div>
            {order.refundStatus === 'COMPLETED' && (
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider text-red-750 mb-1">Refund Amount</p>
                <p className="font-bold text-slate-850">
                  ₹{(order.refundAmountPaise ? order.refundAmountPaise / 100 : 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* User visible reason */}
          {order.userVisibleRejectionReason && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black tracking-wider text-red-700/70">Reason Shared with User</p>
              <div className="p-3 bg-white border border-red-100 rounded-xl text-xs text-slate-700 italic leading-relaxed">
                {order.userVisibleRejectionReason}
              </div>
            </div>
          )}

          {/* Internal reason */}
          {order.internalRejectionReason && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black tracking-wider text-red-700/70">Internal Rejection Note (Admin Only)</p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-750 font-medium leading-relaxed">
                {order.internalRejectionReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Completed Order Summary Panel (SUCCESS only) ── */}
      {order.orderStatus === 'SUCCESS' && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-150 pb-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle size={18} className="text-emerald-500" />
              <h2>Order Completed Successfully</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
              SUCCESS
            </span>
          </div>

          {/* Completion metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-emerald-700/70 mb-1">Completed At</p>
              <p className="font-bold text-emerald-900">{formatDateTime(order.completedAt)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-emerald-700/70 mb-1">Completed By</p>
              <p className="font-bold text-emerald-900">{completionSummary?.completedBy || 'Admin'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-emerald-700/70 mb-1">Result Type</p>
              <span className="inline-block font-extrabold text-[10px] px-2 py-0.5 border rounded bg-white border-emerald-200 text-emerald-700 uppercase">
                {order.resultTypeSnapshot || 'N/A'}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider text-emerald-700/70 mb-1">Result Label</p>
              <p className="font-semibold text-emerald-900">{order.resultLabelSnapshot || 'N/A'}</p>
            </div>
          </div>

          {/* Customer completion note */}
          {order.userVisibleCompletionNote && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black tracking-wider text-emerald-700/70">Customer Completion Note</p>
              <div className="p-3 bg-white border border-emerald-150 rounded-xl text-xs text-slate-700 italic leading-relaxed">
                {order.userVisibleCompletionNote}
              </div>
            </div>
          )}

          {/* Result file summary */}
          {completionSummary?.result && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black tracking-wider text-emerald-700/70">Delivered Result</p>

              {completionSummary.result.resultType === 'FILE_UPLOAD' && completionSummary.result.fileName && (
                <div className="flex items-center gap-3 p-3 bg-white border border-emerald-150 rounded-xl">
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-500">
                    <File size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 truncate">{completionSummary.result.fileName}</p>
                    <p className="text-[10px] text-slate-400">
                      {completionSummary.result.fileType || 'unknown'} •{' '}
                      {completionSummary.result.fileSize
                        ? completionSummary.result.fileSize > 1024 * 1024
                          ? `${(completionSummary.result.fileSize / (1024 * 1024)).toFixed(2)} MB`
                          : `${(completionSummary.result.fileSize / 1024).toFixed(1)} KB`
                        : '0 KB'}
                    </p>
                  </div>
                </div>
              )}

              {completionSummary.result.resultType === 'TEXT_RESULT' && completionSummary.result.textValue && (
                <div className="p-3 bg-white border border-emerald-150 rounded-xl text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {completionSummary.result.textValue}
                </div>
              )}

              {completionSummary.result.resultType === 'STATUS_ONLY' && (
                <div className="p-3 bg-white border border-emerald-150 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span className="font-semibold">Status-only service delivered successfully.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Result Preparation Section (PROCESSING only) ── */}
      {order.orderStatus === 'PROCESSING' && (
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText size={16} className="text-blue-600" />
              <h2>Result Preparation & Validation</h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[8px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
              <Shield size={10} /> Admin Only
            </span>
          </div>

          {/* Immutable Snapshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Result Type</span>
              <span className="font-extrabold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-md inline-block">
                {order.resultTypeSnapshot || 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Result Label</span>
              <span className="font-semibold text-slate-700 block mt-1">
                {order.resultLabelSnapshot || 'No Result Label'}
              </span>
            </div>
          </div>

          {/* Result Specific Inputs */}
          <div className="space-y-4">
            {order.resultTypeSnapshot === 'FILE_UPLOAD' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Upload Result File</label>
                
                {resultFileName ? (
                  <div className="flex flex-col gap-3 p-4 border border-slate-150 bg-blue-50/20 rounded-xl">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-500">
                          <File size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{resultFileName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {resultFileType || 'unknown'} • {resultFileSize ? (resultFileSize > 1024 * 1024 ? `${(resultFileSize / (1024 * 1024)).toFixed(2)} MB` : `${(resultFileSize / 1024).toFixed(1)} KB`) : '0 KB'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setResultFileName('');
                          setResultFileType('');
                          setResultFileSize(null);
                          setResultStoragePath('');
                          setResultValidatedSuccessfully(false);
                          setResultValidationErrors([]);
                          setFileUploadError(null);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {/* Preview & Download buttons for already-uploaded file */}
                    {resultStoragePath && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={getResultFileAccessMutation.isPending}
                          onClick={async () => {
                            setFileUploadError(null);
                            try {
                              const resp = await getResultFileAccessMutation.mutateAsync('VIEW');
                              setPreviewFile({ url: resp.signedUrl, name: resp.fileName || resultFileName, type: resp.fileType || resultFileType });
                            } catch (err: unknown) {
                              const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview link.';
                              setFileUploadError(errorMessage);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-[#145BFF] font-bold rounded-lg text-[10px] transition disabled:opacity-50"
                        >
                          <Eye size={11} />
                          {getResultFileAccessMutation.isPending ? 'Loading...' : 'Preview'}
                        </button>
                        <button
                          type="button"                           onClick={async () => {
                            setFileUploadError(null);
                            try {
                              const resp = await getResultFileAccessMutation.mutateAsync('DOWNLOAD');
                              // Use standard browser download flow. Since backend configures Content-Disposition response headers
                              // on GCS signed URLs, browser will directly download file locally without CORS issue.
                              const link = document.createElement('a');
                              link.href = resp.signedUrl;
                              link.setAttribute('download', resp.fileName || resultFileName);
                              link.setAttribute('target', '_blank');
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } catch (err: unknown) {
                              const errorMessage = err instanceof Error ? err.message : 'Failed to download file.';
                              setFileUploadError(errorMessage);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-[#145BFF] font-bold rounded-lg text-[10px] transition disabled:opacity-50"
                        >
                          <Download size={11} />
                          Download
                        </button>
                        <span className="text-[9px] text-slate-400 ml-auto">Signed URL valid for 5 min</span>
                      </div>
                    )}
                    {fileUploadError && (
                      <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertTriangle size={10} />{fileUploadError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      className="relative border-2 border-dashed border-slate-200 hover:border-[#145BFF] bg-slate-50/50 hover:bg-blue-50/5 rounded-xl p-8 transition duration-200"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (!file) return;
                        await handleResultFileUpload(file);
                      }}
                    >
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        disabled={isUploadingResult}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await handleResultFileUpload(file);
                          // Reset input so same file can be re-selected
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                      />
                      <div className="text-center">
                        {isUploadingResult ? (
                          <>
                            <span className="mx-auto w-7 h-7 border-4 border-blue-200 border-t-[#145BFF] rounded-full animate-spin block mb-3" />
                            <p className="text-xs font-bold text-[#145BFF]">Uploading to secure storage...</p>
                            <p className="text-[10px] text-slate-400 mt-1">Please wait</p>
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto text-slate-350 mb-3 animate-pulse" size={28} />
                            <p className="text-xs font-bold text-slate-600">Drag and drop file here, or click to select</p>
                            <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG • Max 10 MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    {fileUploadError && (
                      <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertTriangle size={10} />{fileUploadError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {order.resultTypeSnapshot === 'TEXT_RESULT' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Result Text Content</label>
                  <span className={`text-[10px] font-bold ${resultText.length > 10000 ? 'text-red-500 font-extrabold' : 'text-slate-400'}`}>
                    {resultText.length} / 10000 chars
                  </span>
                </div>
                <textarea
                  value={resultText}
                  onChange={(e) => {
                    setResultText(e.target.value.slice(0, 10000));
                    setResultValidatedSuccessfully(false);
                    setResultValidationErrors([]);
                  }}
                  placeholder="Enter completion details, reports, code results, credentials or instructions here..."
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-[#145BFF] focus:bg-white focus:border-transparent transition duration-200 resize-y outline-none"
                />
              </div>
            )}

            {order.resultTypeSnapshot === 'STATUS_ONLY' && (
              <div className="p-4 bg-amber-50/20 border border-amber-150/50 rounded-xl flex gap-3 text-xs text-amber-700">
                <Info className="flex-shrink-0 text-amber-550" size={16} />
                <div>
                  <p className="font-bold">Status-Only Completion Mode</p>
                  <p className="text-slate-500 mt-0.5">This service does not deliver file or text reports. Complete this order by filling out the user completion note below.</p>
                </div>
              </div>
            )}
          </div>

          {/* Completion Notes */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">User-Visible Completion Note (Required)</label>
                <span className="text-[8px] font-black uppercase text-red-500 bg-red-50 border border-red-100 px-1 py-0.2 rounded">Required</span>
              </div>
              <textarea
                value={userVisibleCompletionNote}
                onChange={(e) => {
                  setUserVisibleCompletionNote(e.target.value);
                  setResultValidatedSuccessfully(false);
                  setResultValidationErrors([]);
                }}
                placeholder="This note will be visible on the customer's portal and email notifications when completed."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-[#145BFF] focus:bg-white focus:border-transparent transition duration-200 resize-y outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Internal Completion Remarks (Optional)</label>
                <span className="text-[8px] font-black uppercase text-slate-450 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">Optional</span>
              </div>
              <textarea
                value={internalCompletionNote}
                onChange={(e) => {
                  setInternalCompletionNote(e.target.value);
                  setResultValidatedSuccessfully(false);
                  setResultValidationErrors([]);
                }}
                placeholder="Internal notes regarding completion reasons, tracking reference IDs, or processing notes for auditors."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-[#145BFF] focus:bg-white focus:border-transparent transition duration-200 resize-y outline-none"
              />
            </div>
          </div>

          {/* Action Status Feedback */}
          {(resultActionError || resultActionSuccess || resultValidationErrors.length > 0 || resultValidatedSuccessfully) && (
            <div className="space-y-2 text-xs">
              {resultActionError && (
                <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-600 flex items-start gap-2">
                  <AlertTriangle className="flex-shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="font-bold">Action Failed</p>
                    <p className="mt-0.5">{resultActionError}</p>
                  </div>
                </div>
              )}
              {resultActionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-600 flex items-start gap-2">
                  <CheckCircle className="flex-shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="font-bold">Success</p>
                    <p className="mt-0.5">{resultActionSuccess}</p>
                  </div>
                </div>
              )}
              {resultValidationErrors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-150 rounded-xl text-amber-750 flex items-start gap-2">
                  <AlertTriangle className="flex-shrink-0 mt-0.5" size={14} />
                  <div>
                    <p className="font-bold">Validation Issues Found</p>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] font-medium text-amber-800">
                      {resultValidationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {resultValidatedSuccessfully && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-600 flex items-center gap-2">
                  <CheckCircle className="flex-shrink-0" size={14} />
                  <p className="font-bold">Result is fully validated & ready for order completion.</p>
                </div>
              )}
            </div>
          )}

          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(prev => !prev)}
              className="px-4 py-2 border border-slate-205 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5"
            >
              <Eye size={14} />
              {isPreviewOpen ? 'Hide Live Preview' : 'Show Live Preview'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saveResultDraftMutation.isPending || validateResultMutation.isPending}
                onClick={async () => {
                  setResultActionError(null);
                  setResultActionSuccess(null);
                  setResultValidationErrors([]);
                  setResultValidatedSuccessfully(false);
                  try {
                    await saveResultDraftMutation.mutateAsync({
                      textValue: resultText?.trim() || null,
                      fileName: resultFileName?.trim() || null,
                      fileType: resultFileType?.trim() || null,
                      fileSize: resultFileSize || null,
                      storagePath: resultStoragePath?.trim() || null,
                      internalCompletionNote: internalCompletionNote?.trim() || null,
                      userVisibleCompletionNote: userVisibleCompletionNote?.trim() || null,
                    });
                    setResultActionSuccess('Result draft progress saved successfully.');
                  } catch (err: unknown) {
                    const error = err as any;
                    console.error('Save draft error:', error);
                    if (error?.response?.data?.errors) {
                      const validationErrors = error.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
                      setResultActionError(`Validation failed: ${validationErrors}`);
                    } else if (error?.response?.data) {
                      const message = error.response.data.message || error.response.data.error || 'Failed to save result draft.';
                      const code = error.response.data.code ? ` (${error.response.data.code})` : '';
                      setResultActionError(`${message}${code}`);
                    } else {
                      const errorMessage = error instanceof Error ? error.message : 'Failed to save result draft.';
                      setResultActionError(errorMessage);
                    }
                  }
                }}
                className="px-4 py-2 border border-slate-205 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saveResultDraftMutation.isPending && (
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                )}
                Save Draft
              </button>

              <button
                type="button"
                disabled={saveResultDraftMutation.isPending || validateResultMutation.isPending}
                onClick={async () => {
                  setResultActionError(null);
                  setResultActionSuccess(null);
                  setResultValidationErrors([]);
                  setResultValidatedSuccessfully(false);
                  try {
                    await saveResultDraftMutation.mutateAsync({
                      textValue: resultText?.trim() || null,
                      fileName: resultFileName?.trim() || null,
                      fileType: resultFileType?.trim() || null,
                      fileSize: resultFileSize || null,
                      storagePath: resultStoragePath?.trim() || null,
                      internalCompletionNote: internalCompletionNote?.trim() || null,
                      userVisibleCompletionNote: userVisibleCompletionNote?.trim() || null,
                    });

                    await validateResultMutation.mutateAsync();
                    setResultValidatedSuccessfully(true);
                  } catch (err: unknown) {
                    const error = err as any;
                    if (error?.response?.data?.errors) {
                      const validationErrors = error.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
                      setResultActionError(`Validation failed: ${validationErrors}`);
                    } else {
                      const errorMsg = error instanceof Error ? error.message : '';
                      if (errorMsg.includes('Validation failed:')) {
                        const cleanErrors = errorMsg.replace('Validation failed: ', '').split(', ');
                        setResultValidationErrors(cleanErrors);
                      } else {
                        setResultActionError(errorMsg || 'Validation check failed.');
                      }
                    }
                  }
                }}
                className="px-4 py-2 bg-[#145BFF] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {validateResultMutation.isPending && (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                Validate Draft
              </button>

              {/* Complete Order button — only for assigned admin or super admin after validation */}
              {(isAssignedToMe || isSuperAdmin) && resultValidatedSuccessfully && (
                <button
                  type="button"
                  disabled={completeOrderMutation.isPending}
                  onClick={() => {
                    setResultActionError(null);
                    setCompleteModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
                >
                  {completeOrderMutation.isPending ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Complete Order
                </button>
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          {isPreviewOpen && (
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider">
                <Eye size={12} className="text-[#145BFF]" />
                <span>Customer Portal Live Preview</span>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Order Result Status</span>
                  <span className="bg-emerald-55 text-emerald-500 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-100">
                    Completed
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Completion Message</span>
                  <div className="text-xs text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100 italic">
                    {userVisibleCompletionNote.trim() || <span className="text-slate-400">(No visible completion note provided yet)</span>}
                  </div>
                </div>

                {order.resultTypeSnapshot === 'FILE_UPLOAD' && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Delivered Result Documents</span>
                    {resultFileName ? (
                      <div className="flex items-center justify-between p-3 border border-slate-150 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="text-blue-500 flex-shrink-0" size={18} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">{resultFileName}</p>
                            <p className="text-[9px] text-slate-400 font-medium">
                              {resultFileType || 'unknown'} • {resultFileSize ? (resultFileSize > 1024 * 1024 ? `${(resultFileSize / (1024 * 1024)).toFixed(2)} MB` : `${(resultFileSize / 1024).toFixed(1)} KB`) : '0 KB'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-blue-50 border border-blue-100 text-[#145BFF] px-2 py-1 rounded-lg font-black uppercase tracking-wider select-none cursor-pointer">
                          Download Result
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No document file prepared yet</p>
                    )}
                  </div>
                )}

                {order.resultTypeSnapshot === 'TEXT_RESULT' && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Delivered Text Result</span>
                    <div className="text-xs text-slate-800 bg-slate-50/50 border border-slate-100 rounded-lg p-3 whitespace-pre-wrap font-mono">
                      {resultText.trim() || <span className="text-slate-400 italic font-sans">(No text result entered yet)</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Timeline & Audit Logs ── */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-bold text-sm">
          <Clock size={16} className="text-blue-500" />
          <h2>Order History & Audit Log Timeline</h2>
        </div>

        {order.timeline.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2 text-center">No Audit Events Yet</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {order.timeline.map((event) => {
              // Icon selector
              let icon = <Info size={12} />;
              let circleColor = 'bg-slate-50 text-slate-500 border-slate-200';
              if (event.action === 'ORDER_CREATED') {
                icon = <CheckCircle size={12} />;
                circleColor = 'bg-emerald-55 text-emerald-500 border-emerald-200';
              } else if (event.action === 'SENSITIVE_DATA_REVEAL') {
                icon = <Shield size={12} />;
                circleColor = 'bg-amber-55 text-amber-500 border-amber-200';
              } else if (event.action === 'DOCUMENT_VIEW') {
                icon = <Eye size={12} />;
                circleColor = 'bg-blue-55 text-blue-500 border-blue-200';
              } else if (event.action === 'DOCUMENT_DOWNLOAD') {
                icon = <Download size={12} />;
                circleColor = 'bg-blue-55 text-blue-500 border-blue-200';
              } else if (event.action === 'ORDER_ASSIGNED' || event.action === 'ORDER_REASSIGNED') {
                icon = <UserCheck size={12} />;
                circleColor = 'bg-purple-55 text-purple-550 border-purple-200';
              } else if (event.action === 'ORDER_CLAIMED') {
                icon = <UserCheck size={12} />;
                circleColor = 'bg-indigo-55 text-indigo-500 border-indigo-200';
              } else if (event.action === 'PROCESSING_STARTED') {
                icon = <Play size={12} />;
                circleColor = 'bg-blue-55 text-blue-555 border-blue-200';
              } else if (event.action === 'NOTE_ADDED') {
                icon = <MessageSquare size={12} />;
                circleColor = 'bg-teal-55 text-teal-600 border-teal-200';
              } else if (event.action === 'RESULT_DRAFT_CREATED') {
                icon = <FileText size={12} />;
                circleColor = 'bg-indigo-55 text-indigo-500 border-indigo-200';
              } else if (event.action === 'RESULT_DRAFT_UPDATED') {
                icon = <FileText size={12} />;
                circleColor = 'bg-amber-55 text-amber-500 border-amber-200';
              } else if (event.action === 'RESULT_VALIDATED') {
                icon = <CheckCircle size={12} />;
                circleColor = 'bg-emerald-55 text-emerald-500 border-emerald-200';
              } else if (event.action === 'RESULT_FILE_UPLOADED') {
                icon = <Upload size={12} />;
                circleColor = 'bg-blue-55 text-blue-500 border-blue-200';
              } else if (event.action === 'RESULT_FILE_REPLACED') {
                icon = <Upload size={12} />;
                circleColor = 'bg-amber-55 text-amber-600 border-amber-200';
              } else if (event.action === 'RESULT_FILE_VIEWED') {
                icon = <Eye size={12} />;
                circleColor = 'bg-purple-55 text-purple-500 border-purple-200';
              } else if (event.action === 'RESULT_FILE_DOWNLOADED') {
                icon = <Download size={12} />;
                circleColor = 'bg-teal-55 text-teal-600 border-teal-200';
              } else if (event.action === 'ORDER_COMPLETED') {
                icon = <CheckCircle size={12} />;
                circleColor = 'bg-emerald-55 text-emerald-600 border-emerald-200';
              } else if (event.action === 'ORDER_REJECTED') {
                icon = <XCircle size={12} />;
                circleColor = 'bg-red-50 text-red-500 border-red-200';
              } else if (event.action === 'WALLET_REFUNDED') {
                icon = <Sparkles size={12} />;
                circleColor = 'bg-emerald-50 text-emerald-600 border-emerald-250';
              }

              return (
                <div key={event.id} className="relative flex items-start gap-4 text-xs">
                  {/* Circle Pin Icon */}
                  <div className={`absolute left-[-21px] top-0.5 w-6 h-6 border flex items-center justify-center rounded-full z-10 ${circleColor}`}>
                    {icon}
                  </div>
                  {/* Event Text block */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="font-extrabold text-slate-800 uppercase tracking-wide text-[10px]">
                        {event.action.replace(/_/g, ' ')}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateTime(event.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {event.remarks || 'Event completed successfully.'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>By: <span className="font-bold text-slate-500">{event.actorName}</span></span>
                      {event.metadata?.ipAddress && (
                        <>
                          <span>•</span>
                          <span className="font-mono">IP: {event.metadata.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reveal Reason Modal ── */}
      {revealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Security Access Justification</h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Action Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              You are requesting to reveal the value of <span className="font-bold text-slate-800">&ldquo;{selectedFieldLabel}&rdquo;</span>. To continue, you must enter a descriptive business justification reason.
            </p>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5 text-[10px] text-rose-700">
              <Shield size={16} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">WARNING:</span> This reveal action will be permanently recorded in the security logs, tracing your Admin ID, timestamp, and IP address.
              </p>
            </div>

            <form onSubmit={handleRevealSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Justification Reason</label>
                <textarea
                  required
                  value={revealReason}
                  onChange={(e) => setRevealReason(e.target.value)}
                  placeholder="e.g. Verifying Aadhaar details against registration details."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition"
                />
              </div>

              {revealError && (
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <XCircle size={12} /> {revealError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setRevealModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revealMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {revealMutation.isPending ? 'Revealing...' : 'Confirm & Reveal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign/Reassign Modal ── */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-blue-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isReassignment ? 'Reassign Administrator' : 'Assign Administrator'}
                </h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Ownership Assignment</p>
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Select Administrator</label>
                <select
                  required
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition"
                >
                  <option value="">Select Admin Account</option>
                  {admins.map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.name} ({adm.email})
                    </option>
                  ))}
                </select>
              </div>

              {isReassignment && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400">Reassignment Reason</label>
                  <textarea
                    required
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="Enter reason for reassignment (e.g. Current admin is offline, specialized review needed)."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition"
                  />
                </div>
              )}

              {actionError && (
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <XCircle size={12} /> {actionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending || reassignMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition disabled:opacity-50 shadow-xs"
                >
                  {assignMutation.isPending || reassignMutation.isPending ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Complete Order Confirmation Modal ── */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 text-emerald-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Complete & Finalize Order
                </h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Action Required</p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="text-slate-800 font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Service Name:</span>
                <span className="text-slate-800 font-bold">{order.serviceNameSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer Name:</span>
                <span className="text-slate-800 font-bold">{order.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Result Type:</span>
                <span className="inline-block font-extrabold text-[10px] px-2 py-0.5 border rounded bg-white border-emerald-250 text-emerald-700 uppercase">
                  {order.resultTypeSnapshot || 'STATUS_ONLY'}
                </span>
              </div>
            </div>

            {/* Completion Notice & Confirmation (FR-5.20) */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs text-slate-700">
              <p className="font-bold text-emerald-950 text-sm">You are about to mark this order as successfully completed.</p>
              <div className="border-t border-emerald-250/20 pt-2.5 space-y-1 text-slate-800">
                <div><span className="text-slate-500 font-medium">Order:</span> <span className="font-bold">{order.orderNumber}</span></div>
                <div><span className="text-slate-500 font-medium">Service:</span> <span className="font-bold">{order.serviceNameSnapshot}</span></div>
              </div>
              <p className="text-slate-500 font-medium mt-1">The result will become available to the user.</p>
            </div>

            {/* Error Message if mutation fails */}
            {completeOrderMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-red-700 mt-0.5">
                    {(completeOrderMutation.error instanceof Error ? completeOrderMutation.error.message : 'Failed to complete order. Please try again.')}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setCompleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                disabled={completeOrderMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const idempotencyKey = `comp-${order.id}-${order.version}-${Date.now()}`;
                  completeOrderMutation.mutate(
                    {
                      version: order.version,
                      idempotencyKey,
                      result: order.resultTypeSnapshot === 'TEXT_RESULT' ? {
                        textValue: resultText,
                      } : order.resultTypeSnapshot === 'FILE_UPLOAD' ? {
                        fileName: resultFileName,
                        fileType: resultFileType,
                        fileSize: resultFileSize,
                        storagePath: resultStoragePath,
                      } : null,
                      userVisibleCompletionNote: userVisibleCompletionNote,
                      internalCompletionNote: internalCompletionNote || null,
                    },
                    {
                      onSuccess: () => {
                        setCompleteModalOpen(false);
                      },
                    }
                  );
                }}
                disabled={completeOrderMutation.isPending}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {completeOrderMutation.isPending ? 'Finalizing...' : 'Confirm & Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Order Confirmation Modal ── */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Reject Order
                </h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Action Required</p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="text-slate-800 font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Service Name:</span>
                <span className="text-slate-800 font-bold">{order.serviceNameSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Customer Name:</span>
                <span className="text-slate-800 font-bold">{order.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-550 font-medium">Amount:</span>
                <span className="text-slate-800 font-bold">₹{(order.orderAmountPaise / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Rejection Options Form */}
            <div className="space-y-4">
              {/* Refund Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-800">Full Refund will be issued</p>
                  <p className="text-emerald-700 mt-0.5">₹{(order.orderAmountPaise / 100).toFixed(2)} will be automatically credited to the customer's wallet.</p>
                </div>
              </div>

              {/* User Visible Reason */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-450">User Visible Reason (Shared with Customer)</label>
                <textarea
                  value={userVisibleRejectionReason}
                  onChange={(e) => setUserVisibleRejectionReason(e.target.value)}
                  placeholder="Explain why the order is rejected. The user will see this message."
                  rows={3}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition"
                />
              </div>

              {/* Internal Reason */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-450">Internal Reason (Admin Only Comment)</label>
                <textarea
                  value={internalRejectionReason}
                  onChange={(e) => setInternalRejectionReason(e.target.value)}
                  placeholder="Administrative reason. Not shared with the customer."
                  rows={2}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs focus:ring-2 focus:ring-[#145BFF] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Irreversible Warning */}
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 leading-relaxed">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold">Irreversible Action</p>
                <p className="text-amber-700 mt-0.5">
                  This action will reject the order and cannot be undone.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {rejectMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-red-700 mt-0.5">
                    {(rejectMutation.error instanceof Error ? rejectMutation.error.message : 'Failed to reject order. Please try again.')}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setNoRefundReason('');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                disabled={rejectMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectMutation.mutate(
                    {
                      refundOption: 'FULL_REFUND',
                      internalRejectionReason,
                      userVisibleRejectionReason,
                      version: order.version,
                      idempotencyKey: uuidv4(),
                    },
                    {
                      onSuccess: () => {
                        setRejectModalOpen(false);
                        setNoRefundReason('');
                        setInternalRejectionReason('');
                        setUserVisibleRejectionReason('');
                      },
                    }
                  );
                }}
                disabled={
                  rejectMutation.isPending ||
                  !internalRejectionReason.trim() ||
                  !userVisibleRejectionReason.trim()
                }
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Order & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Refund Confirmation Modal (FR-16.6) ── */}
      {refundConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Confirm Refund
                </h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Action Required</p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 mb-1">
                    This order will be rejected and ₹{(order.orderAmountPaise / 100).toFixed(2)} will be returned to the user&apos;s Helping Mitra wallet.
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    This action cannot be automatically reversed.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="text-slate-800 font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Service:</span>
                <span className="text-slate-800 font-bold">{order.serviceNameSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Refund Amount:</span>
                <span className="text-emerald-600 font-bold">₹{(order.orderAmountPaise / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setRefundConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                disabled={rejectMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectMutation.mutate(
                    {
                      refundOption,
                      internalRejectionReason,
                      userVisibleRejectionReason,
                      noRefundReason: refundOption === 'NO_REFUND' ? noRefundReason : undefined,
                      version: order.version,
                      idempotencyKey: uuidv4(),
                    },
                    {
                      onSuccess: () => {
                        setRefundConfirmModalOpen(false);
                        setRejectModalOpen(false);
                        setNoRefundReason('');
                        setInternalRejectionReason('');
                        setUserVisibleRejectionReason('');
                        setRefundOption('FULL_REFUND');
                      },
                    }
                  );
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition active:scale-[0.98]"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Processing...' : 'Reject Order & Refund Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Concurrency Error Modal (FR-16.3) ── */}
      {concurrencyErrorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Order Updated
                </h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold">Concurrency Conflict</p>
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900 mb-1">
                    This order was updated by another administrator.
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Refresh the page to view the latest information.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setConcurrencyErrorModalOpen(false);
                  refetch();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition active:scale-[0.98]"
              >
                Refresh Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Preview Lightbox / PDF Modal ── */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-800 truncate max-w-md">{previewFile.name}</h3>
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold mt-0.5">Secure Document Preview</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition"
                >
                  Open in New Tab <ExternalLink size={10} />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-650 transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-50 overflow-auto flex items-center justify-center p-4 relative">
              {previewFile.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain rounded-lg border border-slate-200 shadow-sm"
                />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-full rounded-lg border border-slate-200"
                />
              ) : (
                <div className="text-center p-6">
                  <FileText size={48} className="mx-auto text-slate-355 mb-3 animate-bounce" />
                  <p className="text-xs text-slate-600 font-bold mb-2">No inline preview available for this file type.</p>
                  <a
                    href={previewFile.url}
                    download
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Download File <Download size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
