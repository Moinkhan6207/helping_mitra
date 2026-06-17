import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../authStore';

export const useCurrentUser = () => {
  const { accessToken, setUser, setStatus } = useAuthStore();

  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!accessToken, // Only fetch if we have an active access token
    retry: false, // Don't keep retrying if unauthorized
  });

  const userData = query.data?.data?.user;

  useEffect(() => {
    if (userData) {
      setUser(userData);
      setStatus('authenticated');
    } else if (query.isError) {
      // Clear store if the profile fetch fails with unauthorized
      const apiErr = query.error as any;
      if (apiErr?.error?.code === 'UNAUTHORIZED' || apiErr?.status === 401 || apiErr?.response?.status === 401) {
        setUser(null);
        setStatus('unauthenticated');
      }
    }
  }, [userData, query.isError, query.error, setUser, setStatus]);

  return query;
};
