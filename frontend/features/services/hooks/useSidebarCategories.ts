import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { useAuthStore } from '@/features/auth/authStore';

export interface SidebarService {
  id: string;
  name: string;
  slug: string;
}

export interface SidebarCategory {
  id: string;
  name: string;
  slug: string;
  services: SidebarService[];
}

const fetchSidebarCategories = async (): Promise<SidebarCategory[]> => {
  const response = await axiosClient.get('/services/sidebar/categories');
  return response.data.data;
};

/**
 * useSidebarCategories — Phase 3 Dynamic Sidebar Navigation Hook
 *
 * Rule 3: Only ACTIVE categories returned.
 * Rule 4: Only ACTIVE services within each category returned.
 * Backend enforces these rules — frontend only renders what the API gives.
 *
 * Features:
 * - Caches sidebar structure
 * - Only fetches for authenticated active users
 * - Retry on failure
 * - Long stale time — categories/services rarely change
 */
export const useSidebarCategories = () => {
  const { user, status } = useAuthStore();

  return useQuery({
    queryKey: ['sidebarCategories'],
    queryFn: fetchSidebarCategories,
    enabled: status === 'authenticated' && user?.role === 'USER',
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes in cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
