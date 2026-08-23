import { create } from 'zustand';

export const useThemeStore = create((set, get) => ({
  theme: 'dark', // 'dark' | 'light'

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('agentflow_theme');
    const initial = saved || 'dark';
    set({ theme: initial });
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('agentflow_theme', next);
    set({ theme: next });

    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  },

  setTheme: (newTheme) => {
    localStorage.setItem('agentflow_theme', newTheme);
    set({ theme: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  },
}));

export default useThemeStore;
