import { create } from 'zustand';
import type { WatchlistItem } from '@/types';
import { api } from '@/services/api';
import { useAuthStore } from './authStore';

interface WatchlistState {
  items: WatchlistItem[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (symbol: string) => Promise<void>;
  remove: (symbol: string) => Promise<void>;
  reorder: (symbols: string[]) => void;
  has: (symbol: string) => boolean;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  loading: false,
  fetch: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const items = await api.getWatchlist(token);
      set({ items, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  add: async (symbol) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.addToWatchlist(token, symbol);
    set({ items: [...get().items, { symbol, addedAt: Date.now() }] });
  },
  remove: async (symbol) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.removeFromWatchlist(token, symbol);
    set({ items: get().items.filter((i) => i.symbol !== symbol) });
  },
  reorder: (symbols) => {
    const reordered = symbols
      .map((s) => get().items.find((i) => i.symbol === s))
      .filter(Boolean) as WatchlistItem[];
    set({ items: reordered });
    // Dragging fires onReorder for every swap, so wait until the drag settles and save once.
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const token = useAuthStore.getState().token;
      if (token) api.reorderWatchlist(token, get().items.map((i) => i.symbol)).catch(() => undefined);
    }, 600);
  },
  has: (symbol) => get().items.some((i) => i.symbol === symbol),
}));
