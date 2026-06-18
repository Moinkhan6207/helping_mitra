import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => serviceApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
    gcTime: 15 * 60 * 1000,   // Keep in cache for 15 minutes
  });
};
