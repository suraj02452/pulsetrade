import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { User } from '@/types';
import { api } from '@/services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
}

/** localStorage that never throws (private windows and blocked storage just mean "not remembered"). */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* storage unavailable */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* storage unavailable */
    }
  },
};

/**
 * The session (JWT + user) is kept in localStorage so a page refresh keeps you signed in.
 * On startup the token is re-checked with the backend (see SessionGuard in App.tsx).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const res = await api.login(email, password);
        set({ token: res.token, user: res.user, isAuthenticated: true });
      },
      register: async (email, password, username) => {
        const res = await api.register(email, password, username);
        set({ token: res.token, user: res.user, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'pulsetrade-auth',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
