import { create } from 'zustand';
import type { Price, PriceUpdate, ConnectionStatus } from '@/types';
import { api } from '@/services/api';
import { coinName } from '@/utils/constants';

interface PriceState {
  prices: Map<string, Price>;
  loading: boolean;
  connectionStatus: ConnectionStatus;
  fetchPrices: () => Promise<void>;
  applyUpdate: (update: PriceUpdate) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const usePriceStore = create<PriceState>((set, get) => ({
  prices: new Map(),
  loading: true,
  connectionStatus: 'disconnected',
  fetchPrices: async () => {
    set({ loading: true });
    try {
      const prices = await api.getPrices();
      const map = new Map<string, Price>();
      prices.forEach((p) => map.set(p.symbol, p));
      set({ prices: map, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  applyUpdate: (update) => {
    const prices = get().prices;
    const existing = prices.get(update.symbol) ?? {
      // First time we see this coin (e.g. its first tick arrived after the page loaded).
      symbol: update.symbol,
      name: coinName(update.symbol),
      price: update.price,
      change24h: update.change24h,
      high24h: update.high24h ?? update.price,
      low24h: update.low24h ?? update.price,
      volume24h: update.volume24h ?? 0,
      timestamp: update.timestamp,
      history: [],
    };
    const newPrice: Price = {
      ...existing,
      price: update.price,
      change24h: update.change24h,
      timestamp: update.timestamp,
      history: [...existing.history.slice(-59), update.price],
      high24h: update.high24h ?? Math.max(existing.high24h, update.price),
      low24h: update.low24h ?? Math.min(existing.low24h, update.price),
      volume24h: update.volume24h ?? existing.volume24h,
    };
    const newMap = new Map(prices);
    newMap.set(update.symbol, newPrice);
    set({ prices: newMap });
  },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
