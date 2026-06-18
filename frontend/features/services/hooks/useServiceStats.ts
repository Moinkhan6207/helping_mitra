import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';

export const useServiceStats = () => {
  return useQuery({
    queryKey: ['service-stats'],
    queryFn: () => serviceApi.getServiceStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
