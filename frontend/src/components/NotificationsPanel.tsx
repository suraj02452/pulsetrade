import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { formatTime } from '@/utils/format';

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, clear } = useNotificationStore();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-12 w-80 max-h-96 bg-bg-card border border-bg-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-brand-400" />
            <span className="font-semibold text-sm text-slate-100">Notifications</span>
          </div>
          <div className="flex gap-1">
            <button onClick={markAllRead} className="p-1.5 rounded-lg hover:bg-bg-hover text-muted" title="Mark all read">
              <CheckCheck size={14} />
            </button>
            <button onClick={clear} className="p-1.5 rounded-lg hover:bg-bg-hover text-muted" title="Clear all">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted text-sm">
              <Bell size={24} className="mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-bg-border/50 hover:bg-bg-hover/50 transition-colors ${
                  !n.read ? 'bg-brand-600/5' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">{n.message}</p>
                    <p className="text-xs text-muted mt-0.5">{formatTime(n.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}
