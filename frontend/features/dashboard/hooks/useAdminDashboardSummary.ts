import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { useAuthStore } from '@/features/auth/authStore';

export const useAdminDashboardSummary = () => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['adminDashboardSummary'],
    queryFn: dashboardApi.getAdminSummary,
    enabled: status === 'authenticated' && user?.role === 'ADMIN',
  });
};
export default useAdminDashboardSummary;
