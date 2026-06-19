import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('helping_mitra_dark_mode', String(newMode));
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDarkMode: newMode };
    });
  },
  initializeTheme: () => {
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem('helping_mitra_dark_mode') === 'true';
      if (persisted) {
        document.documentElement.classList.add('dark');
        set({ isDarkMode: true });
      } else {
        document.documentElement.classList.remove('dark');
        set({ isDarkMode: false });
      }
    }
  },
}));
