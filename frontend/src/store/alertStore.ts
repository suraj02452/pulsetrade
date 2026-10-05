import { create } from 'zustand';
import type { Alert, AlertCondition } from '@/types';
import { api } from '@/services/api';
import { useAuthStore } from './authStore';

interface AlertState {
  alerts: Alert[];
  loading: boolean;
  fetch: () => Promise<void>;
  create: (symbol: string, condition: AlertCondition, targetPrice: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  rearm: (id: string) => Promise<void>;
  markTriggered: (alertId: string, currentPrice: number, message: string) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  loading: false,
  fetch: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const alerts = await api.getAlerts(token);
      set({ alerts, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  create: async (symbol, condition, targetPrice) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const alert = await api.createAlert(token, symbol, condition, targetPrice);
    set({ alerts: [alert, ...get().alerts] });
  },
  remove: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.deleteAlert(token, id);
    set({ alerts: get().alerts.filter((a) => a.id !== id) });
  },
  rearm: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    await api.rearmAlert(token, id);
    set({
      alerts: get().alerts.map((a) =>
        a.id === id ? { ...a, status: 'ACTIVE', triggeredAt: undefined } : a
      ),
    });
  },
  markTriggered: (alertId, currentPrice, message) => {
    set({
      alerts: get().alerts.map((a) =>
        a.id === alertId
          ? { ...a, status: 'TRIGGERED', triggeredAt: Date.now(), currentPrice, message }
          : a
      ),
    });
  },
}));
