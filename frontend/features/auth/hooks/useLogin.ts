import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../authStore';

export const useLogin = () => {
  const router = useRouter();
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

      // Role-based routing preparation
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    },
  });
};
