import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('mangzone-theme', theme);
}

const saved = (localStorage.getItem('mangzone-theme') as Theme) ?? 'light';
applyTheme(saved);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: saved,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    set((s) => {
      const next: Theme = s.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return { theme: next };
    });
  },
}));
