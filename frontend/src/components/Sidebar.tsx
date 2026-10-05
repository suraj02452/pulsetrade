import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Star, Bell, Wallet, Activity, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-bg-border bg-bg-surface/50 backdrop-blur-sm fixed h-full z-30">
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        <span className="text-lg font-bold text-slate-100">PulseTrade</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-300'
                    : 'text-muted hover:text-slate-200 hover:bg-bg-hover'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-bg-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{user?.username || 'User'}</div>
            <div className="text-xs text-muted truncate">{user?.email || ''}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
