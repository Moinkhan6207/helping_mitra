import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { useAuthStore } from '@/features/auth/authStore';

export interface RechargeConfigResponse {
  minAmountPaise: number;
  maxAmountPaise: number;
  paymentExpiryMinutes: number;
  utrSubmissionGraceHours: number;
}

export interface RechargeItem {
  id: string;
  rechargeNumber: string;
  requestedAmountPaise: number;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  resolvedAt: string | null;
  latestMaskedUtr?: string | null;
}

export interface RechargeAuditLogItem {
  id: string;
  action: string;
  oldStatus: string | null;
  newStatus: string;
  remarks: string | null;
  createdAt: string;
  performedByUser?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface RechargeDetailsResponse {
  id: string;
  rechargeNumber: string;
  userId: string;
  requestedAmountPaise: number;
  upiAccountId: string | null;
  upiVpaSnapshot: string | null;
  payeeNameSnapshot: string | null;
  paymentNote: string | null;
  status: string;
  paymentExpiresAt: string | null;
  utrSubmissionDeadline: string | null;
  submittedAt: string | null;
  reviewStartedByAdminId: string | null;
  reviewStartedAt: string | null;
  resolvedByAdminId: string | null;
  resolvedAt: string | null;
  verifiedAmountPaise: number | null;
  paymentDate: string | null;
  receivingAccountId: string | null;
  adminRemarks: string | null;
  rejectionReason: string | null;
  creditedAt: string | null;
  resubmissionCount: number;
  maxResubmissionLimit?: number;
  createdAt: string;
  updatedAt: string;
  auditLogs?: RechargeAuditLogItem[];
  submissions?: RechargeSubmissionItem[];
}

export interface RechargeSubmissionItem {
  id: string;
  rechargeId: string;
  submissionNumber: number;
  utr: string;
  proofStoragePath: string | null;
  submittedByUserId: string;
  submittedAt: string;
  status: string;
  adminRemarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListRechargesResponse {
  recharges: RechargeItem[];
  total: number;
}

const fetchRechargeConfig = async (): Promise<RechargeConfigResponse> => {
  const response = await axiosClient.get('/wallet/recharges/config');
  return response.data.data;
};

export const useRechargeConfig = () => {
  return useQuery({
    queryKey: ['rechargeConfig'],
    queryFn: fetchRechargeConfig,
    staleTime: 24 * 60 * 60 * 1000, // Config is static, cache it for 24h
    gcTime: 24 * 60 * 60 * 1000,
  });
};

const createRechargeRequest = async (amountPaise: number): Promise<{ existingRecharge: boolean; recharge: RechargeDetailsResponse }> => {
  const response = await axiosClient.post('/wallet/recharges', { amountPaise });
  return response.data.data;
};

export const useCreateRecharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRechargeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRecharges'] });
    },
  });
};

const fetchMyRecharges = async (filters: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<ListRechargesResponse> => {
  const response = await axiosClient.get('/wallet/recharges', { params: filters });
  return response.data.data;
};

export const useMyRecharges = (filters: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['myRecharges', filters],
    queryFn: () => fetchMyRecharges(filters),
    enabled: status === 'authenticated' && user?.role === 'USER',
    staleTime: 10 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};

const fetchRechargeDetails = async (rechargeId: string): Promise<RechargeDetailsResponse> => {
  const response = await axiosClient.get(`/wallet/recharges/${rechargeId}`);
  return response.data.data;
};

export const useRechargeDetails = (rechargeId: string) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['rechargeDetails', rechargeId],
    queryFn: () => fetchRechargeDetails(rechargeId),
    enabled: status === 'authenticated' && user?.role === 'USER' && !!rechargeId,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};

export interface RechargePaymentDataResponse {
  upiVpa: string;
  payeeName: string;
  amountPaise: number;
  rechargeNumber: string;
  paymentNote: string;
  upiUri: string;
  paymentExpiresAt: string;
}

const fetchRechargePaymentData = async (rechargeId: string): Promise<RechargePaymentDataResponse> => {
  const response = await axiosClient.get(`/wallet/recharges/${rechargeId}/payment-data`);
  return response.data.data;
};

export const useRechargePayment = (rechargeId: string) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['rechargePaymentData', rechargeId],
    queryFn: () => fetchRechargePaymentData(rechargeId),
    enabled: status === 'authenticated' && user?.role === 'USER' && !!rechargeId,
    staleTime: 10 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};

const markPaymentInitiated = async (rechargeId: string): Promise<RechargeDetailsResponse> => {
  const response = await axiosClient.patch(`/wallet/recharges/${rechargeId}/payment-initiated`);
  return response.data.data;
};

export const useMarkPaymentInitiated = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markPaymentInitiated,
    onSuccess: (_, rechargeId) => {
      queryClient.invalidateQueries({ queryKey: ['rechargeDetails', rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['rechargePaymentData', rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['myRecharges'] });
    },
  });
};

export const useRechargeQR = (rechargeId: string) => {
  const { data: paymentData } = useRechargePayment(rechargeId);
  if (!paymentData?.upiUri) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentData.upiUri)}`;
};

const submitVerification = async ({
  rechargeId,
  utr,
  proofStoragePath,
}: {
  rechargeId: string;
  utr: string;
  proofStoragePath?: string | null;
}): Promise<any> => {
  const response = await axiosClient.post(`/wallet/recharges/${rechargeId}/verifications`, {
    utr,
    proofStoragePath,
  });
  return response.data.data;
};

export const useSubmitVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitVerification,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rechargeDetails', variables.rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['myRecharges'] });
    },
  });
};

const fetchProofUrl = async (rechargeId: string, submissionId: string): Promise<{ signedUrl: string }> => {
  const response = await axiosClient.get(`/wallet/recharges/${rechargeId}/verifications/${submissionId}/proof-url`);
  return response.data.data;
};

export const useProofUrl = (rechargeId: string, submissionId: string, enabled = false) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['rechargeProofUrl', rechargeId, submissionId],
    queryFn: () => fetchProofUrl(rechargeId, submissionId),
    enabled: status === 'authenticated' && user?.role === 'USER' && !!rechargeId && !!submissionId && enabled,
    staleTime: 5 * 60 * 1000, // Valid for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export interface AdminSummaryResponse {
  pendingCount: number;
  reviewCount: number;
  creditedCount: number;
  rejectedCount: number;
}

export interface AdminRechargeItem {
  id: string;
  rechargeNumber: string;
  requestedAmountPaise: number;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  userName: string;
  userMobile: string;
  userType: string;
  reviewerName: string | null;
  maskedUtr: string | null;
  ageString: string;
}

export interface AdminRechargeQueueResponse {
  recharges: AdminRechargeItem[];
  total: number;
  summary: AdminSummaryResponse;
}

const fetchAdminRechargeQueue = async (filters: any): Promise<AdminRechargeQueueResponse> => {
  const response = await axiosClient.get('/wallet/admin/recharges', { params: filters });
  return response.data.data;
};

export const useAdminRechargeQueue = (filters: any) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['adminRechargeQueue', filters],
    queryFn: () => fetchAdminRechargeQueue(filters),
    enabled: status === 'authenticated' && user?.role === 'ADMIN',
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};

const fetchAdminRechargeDetails = async (rechargeId: string): Promise<any> => {
  const response = await axiosClient.get(`/wallet/admin/recharges/${rechargeId}`);
  return response.data.data;
};

export const useAdminRechargeDetails = (rechargeId: string) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['adminRechargeDetails', rechargeId],
    queryFn: () => fetchAdminRechargeDetails(rechargeId),
    enabled: status === 'authenticated' && user?.role === 'ADMIN' && !!rechargeId,
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};

const startReview = async (rechargeId: string): Promise<any> => {
  const response = await axiosClient.patch(`/wallet/admin/recharges/${rechargeId}/review`);
  return response.data.data;
};

export const useStartReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startReview,
    onSuccess: (_, rechargeId) => {
      queryClient.invalidateQueries({ queryKey: ['adminRechargeDetails', rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['adminRechargeQueue'] });
    },
  });
};

const fetchAdminProofUrl = async (rechargeId: string, submissionId: string): Promise<{ signedUrl: string }> => {
  const response = await axiosClient.get(`/wallet/admin/recharges/${rechargeId}/verifications/${submissionId}/proof-url`);
  return response.data.data;
};

export const useAdminProofUrl = (rechargeId: string, submissionId: string, enabled = false) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['adminProofUrl', rechargeId, submissionId],
    queryFn: () => fetchAdminProofUrl(rechargeId, submissionId),
    enabled: status === 'authenticated' && user?.role === 'ADMIN' && !!rechargeId && !!submissionId && enabled,
    staleTime: 5 * 60 * 1000, // Valid for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

const approveRecharge = async ({
  rechargeId,
  verifiedAmountPaise,
  paymentDate,
  receivingAccountId,
  adminRemarks,
}: {
  rechargeId: string;
  verifiedAmountPaise: number;
  paymentDate: string;
  receivingAccountId: string;
  adminRemarks?: string | null;
}): Promise<any> => {
  const response = await axiosClient.post(`/wallet/admin/recharges/${rechargeId}/approve`, {
    verifiedAmountPaise,
    paymentDate,
    receivingAccountId,
    adminRemarks,
  });
  return response.data.data;
};

export const useApproveRecharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveRecharge,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminRechargeDetails', variables.rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['adminRechargeQueue'] });
    },
  });
};

const rejectRecharge = async ({
  rechargeId,
  rejectionReason,
}: {
  rechargeId: string;
  rejectionReason: string;
}): Promise<any> => {
  const response = await axiosClient.post(`/wallet/admin/recharges/${rechargeId}/reject`, {
    rejectionReason,
  });
  return response.data.data;
};

export const useRejectRecharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectRecharge,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminRechargeDetails', variables.rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['adminRechargeQueue'] });
    },
  });
};

const resubmitVerification = async ({
  rechargeId,
  utr,
  proofStoragePath,
}: {
  rechargeId: string;
  utr?: string | null;
  proofStoragePath?: string | null;
}): Promise<any> => {
  const response = await axiosClient.post(`/wallet/recharges/${rechargeId}/verifications/resubmit`, {
    utr,
    proofStoragePath,
  });
  return response.data.data;
};

export const useResubmitVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resubmitVerification,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rechargeDetails', variables.rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['myRecharges'] });
    },
  });
};

const cancelRechargeRequest = async (rechargeId: string): Promise<any> => {
  const response = await axiosClient.patch(`/wallet/recharges/${rechargeId}/cancel`);
  return response.data.data;
};

export const useCancelRecharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelRechargeRequest,
    onSuccess: (_, rechargeId) => {
      queryClient.invalidateQueries({ queryKey: ['rechargeDetails', rechargeId] });
      queryClient.invalidateQueries({ queryKey: ['myRecharges'] });
    },
  });
};

export interface AdminWalletLedgerItem {
  id: string;
  walletId: string;
  amount: number;
  amountPaise: number;
  type: 'DEBIT' | 'CREDIT' | 'REFUND' | 'ADJUSTMENT';
  balanceBefore: number;
  balanceBeforePaise: number;
  balanceAfter: number;
  balanceAfterPaise: number;
  referenceType: 'ORDER' | 'RECHARGE' | 'REFUND' | 'ADJUSTMENT';
  referenceId: string;
  status: 'COMPLETED' | 'REVERSED';
  remark: string;
  remarks: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  userType: string | null;
}

export interface AdminWalletLedgerResponse {
  ledgers: AdminWalletLedgerItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetchAdminWalletLedger = async (filters: any): Promise<AdminWalletLedgerResponse> => {
  const response = await axiosClient.get('/wallet/admin/ledger', { params: filters });
  return response.data.data;
};

export const useAdminWalletLedger = (filters: any) => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['adminWalletLedger', filters],
    queryFn: () => fetchAdminWalletLedger(filters),
    enabled: status === 'authenticated' && user?.role === 'ADMIN',
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
  });
};

