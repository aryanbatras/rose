import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
  } else if (theme === 'dark') {
    root.classList.add('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light' as Theme,
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          applyTheme(theme);
        }
      },
    }),
    {
      name: 'rose-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme && typeof window !== 'undefined') {
          applyTheme(state.theme);
        }
      },
    }
  )
);
