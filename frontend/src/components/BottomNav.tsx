import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Star, Bell, Wallet } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/watchlist', label: 'Watchlist', icon: Star },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
];

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/90 backdrop-blur-md border-t border-bg-border px-2 py-1.5 flex justify-around">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to}>
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive ? 'text-brand-400' : 'text-muted'
            }`}>
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
