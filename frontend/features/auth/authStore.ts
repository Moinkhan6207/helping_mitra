import { create } from 'zustand';
import { User } from './types';
import { authApi } from './api/auth.api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setStatus: (status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated') => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  status: 'idle',

  login: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('helping_mitra_access_token', accessToken);
      localStorage.setItem('helping_mitra_refresh_token', refreshToken);
      localStorage.setItem('helping_mitra_user', JSON.stringify(user));
    }
    set({
      accessToken,
      refreshToken,
      user,
      status: 'authenticated',
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('helping_mitra_access_token');
      localStorage.removeItem('helping_mitra_refresh_token');
      localStorage.removeItem('helping_mitra_user');
    }
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'unauthenticated',
    });
  },

  setAccessToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('helping_mitra_access_token', token);
      } else {
        localStorage.removeItem('helping_mitra_access_token');
      }
    }
    set({ accessToken: token });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('helping_mitra_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('helping_mitra_user');
      }
    }
    set({ user });
  },

  setStatus: (status) => set({ status }),

  initializeAuth: async () => {
    if (typeof window === 'undefined') return;

    set({ status: 'loading' });
    const accessToken = localStorage.getItem('helping_mitra_access_token');
    const refreshToken = localStorage.getItem('helping_mitra_refresh_token');
    const userJson = localStorage.getItem('helping_mitra_user');

    if (!refreshToken) {
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        status: 'unauthenticated',
      });
      return;
    }

    let user: User | null = null;
    try {
      if (userJson) {
        user = JSON.parse(userJson);
      }
    } catch (e) {
      // Silently catch json parse error
    }

    set({ accessToken, refreshToken, user, status: accessToken ? 'authenticated' : 'loading' });

    // Validate access token by fetching profile `/auth/me`
    try {
      const response = await authApi.getCurrentUser();
      const verifiedUser = response.data.user;
      localStorage.setItem('helping_mitra_user', JSON.stringify(verifiedUser));
      set({
        user: verifiedUser,
        status: 'authenticated',
      });
    } catch (error) {
      // If fetching me fails (e.g. token expired), try refreshing
      try {
        const refreshResponse = await authApi.refreshToken(refreshToken);
        const newAccessToken = refreshResponse.data.accessToken;
        localStorage.setItem('helping_mitra_access_token', newAccessToken);
        set({ accessToken: newAccessToken });

        // Retry profile fetch with the new access token
        const profileResponse = await authApi.getCurrentUser();
        const refreshedUser = profileResponse.data.user;
        localStorage.setItem('helping_mitra_user', JSON.stringify(refreshedUser));
        set({
          user: refreshedUser,
          status: 'authenticated',
        });
      } catch (refreshErr) {
        // If refresh fails, clear everything
        localStorage.removeItem('helping_mitra_access_token');
        localStorage.removeItem('helping_mitra_refresh_token');
        localStorage.removeItem('helping_mitra_user');
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          status: 'unauthenticated',
        });
      }
    }
  },
}));
