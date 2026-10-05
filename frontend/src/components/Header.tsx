import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, Moon, Sun, X, LogOut, LayoutDashboard, Star, Wallet } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import { LiveBadge } from './LiveBadge';
import { NotificationsPanel } from './NotificationsPanel';
import { useThemeStore } from '@/store/themeStore';
import { usePriceStore } from '@/store/priceStore';
import { useNotificationStore } from '@/store/notificationStore';
import { logoutAndClearSession } from '@/store/session';
import { BottomNav } from './BottomNav';

const mobileNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
];

export function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, toggle } = useThemeStore();
  const connectionStatus = usePriceStore((s) => s.connectionStatus);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-bg-border bg-bg-base/80 backdrop-blur-md px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-bg-hover text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <LiveBadge status={connectionStatus} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-bg-hover text-slate-300 transition-colors"
          >
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-lg hover:bg-bg-hover text-slate-300 transition-colors relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-down text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              logoutAndClearSession();
              navigate('/');
            }}
            className="p-2 rounded-lg hover:bg-bg-hover text-slate-300 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-60 h-full bg-bg-surface border-r border-bg-border p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <MobileNav onNavigate={() => setMobileMenuOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </>
  );
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="space-y-1 mt-4">
      {mobileNavItems.map((item) => (
        <NavLink key={item.to} to={item.to} onClick={onNavigate}>
          {({ isActive }) => (
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-600/15 text-brand-300' : 'text-muted hover:text-slate-200 hover:bg-bg-hover'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
