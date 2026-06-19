import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { useAuthStore } from '@/features/auth/authStore';

interface WalletBalanceResponse {
  balance: number;
}

const fetchWalletBalance = async (): Promise<WalletBalanceResponse> => {
  const response = await axiosClient.get('/wallet/balance');
  return response.data.data;
};

/**
 * useWalletBalance — Phase 3 Read-Only Wallet Balance Hook
 *
 * Rule 5: Wallet balance is READ ONLY.
 * No add money, PhonePe payment or wallet credit logic here.
 * Funding is done only via seed data / dev scripts / internal admin setup.
 *
 * Features:
 * - Caches balance in React Query
 * - Auto-refetches on window focus and after order placement
 * - Loading and error states
 */
export const useWalletBalance = () => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['walletBalance'],
    queryFn: fetchWalletBalance,
    enabled: status === 'authenticated' && user?.role === 'USER',
    staleTime: 30 * 1000,      // 30 seconds — balance is financially sensitive
    gcTime: 2 * 60 * 1000,     // Keep in cache 2 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
};

/**
 * Returns a function to invalidate and refetch wallet balance.
 * Call this after an order is placed to keep balance in sync.
 */
export const useInvalidateWalletBalance = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
};

export interface WalletLedgerItem {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  balanceBefore: number;
  balanceAfter: number;
  referenceType: 'ORDER' | 'TOPUP' | 'SYSTEM';
  referenceId: string;
  remark: string;
  createdAt: string;
  orderNumber: string;
  serviceName: string;
  serviceSlug: string;
}

const fetchWalletLedger = async (): Promise<WalletLedgerItem[]> => {
  const response = await axiosClient.get('/wallet/ledger');
  return response.data.data;
};

export const useWalletLedger = () => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['walletLedger'],
    queryFn: fetchWalletLedger,
    enabled: status === 'authenticated' && user?.role === 'USER',
    staleTime: 10 * 1000,      // Keep short as transactions occur
    gcTime: 2 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
};

const topupWallet = async (amount: number): Promise<{ newBalance: number; transactionId: string }> => {
  const response = await axiosClient.post('/wallet/topup', { amount });
  return response.data.data;
};

export const useWalletTopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: topupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletLedger'] });
    },
  });
};
