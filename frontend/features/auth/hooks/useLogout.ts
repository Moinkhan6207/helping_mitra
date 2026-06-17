import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../authStore';

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const localLogout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        return authApi.logout(refreshToken);
      }
      return { success: true, message: 'No session', data: {} as any };
    },
    onSettled: () => {
      // Clean up the local store and localStorage regardless of whether the api request succeeded
      localLogout();
      queryClient.clear();
      router.push('/login');
    },
  });
};
