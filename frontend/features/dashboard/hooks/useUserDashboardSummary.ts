import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { useAuthStore } from '@/features/auth/authStore';

export const useUserDashboardSummary = () => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['userDashboardSummary'],
    queryFn: dashboardApi.getUserSummary,
    enabled: status === 'authenticated' && user?.role === 'USER',
  });
};
export default useUserDashboardSummary;
