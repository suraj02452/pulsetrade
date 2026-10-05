import { create } from 'zustand';
import type { ThemeMode } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  set: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'pulsetrade-theme';

function readSavedMode(): ThemeMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function apply(mode: ThemeMode) {
  document.documentElement.classList.toggle('light', mode === 'light');
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable: the theme just won't be remembered */
  }
}

const initialMode = readSavedMode();
document.documentElement.classList.toggle('light', initialMode === 'light');

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ mode: next });
  },
  set: (mode) => {
    apply(mode);
    set({ mode });
  },
}));
