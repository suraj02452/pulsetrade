import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  add: (n: Omit<Notification, 'id' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  add: (n) => {
    const notification: Notification = { ...n, id: Math.random().toString(36).substring(2), read: false };
    set({ notifications: [notification, ...get().notifications], unreadCount: get().unreadCount + 1 });
  },
  markAllRead: () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
  },
  clear: () => set({ notifications: [], unreadCount: 0 }),
}));
