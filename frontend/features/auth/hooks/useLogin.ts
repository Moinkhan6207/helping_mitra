import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../authStore';

export const useLogin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      
      // Store user and token information in Zustand/localStorage
      loginStore(user, accessToken, refreshToken);
      
      // Invalidate existing queries to trigger fresh user profile fetch if needed
      queryClient.clear();

      // Check if a redirect parameter is present
      const redirect = searchParams?.get('redirect');
      if (redirect) {
        router.push(redirect);
        return;
      }

      // Role-based routing preparation
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    },
  });
};
