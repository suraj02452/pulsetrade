import { create } from 'zustand';
import type { Holding } from '@/types';
import { api } from '@/services/api';
import { useAuthStore } from './authStore';

interface PortfolioState {
  holdings: Holding[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (symbol: string, quantity: number, buyPrice: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  holdings: [],
  loading: false,
  fetch: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const holdings = await api.getHoldings(token);
      set({ holdings, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  add: async (symbol, quantity, buyPrice) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const holding = await api.addHolding(token, symbol, quantity, buyPrice);
    set({ holdings: [...get().holdings, holding] });
  },
  remove: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.deleteHolding(token, id);
    set({ holdings: get().holdings.filter((h) => h.id !== id) });
  },
}));
