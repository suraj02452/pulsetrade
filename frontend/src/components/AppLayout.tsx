import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/authStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useAlertStore } from '@/store/alertStore';
import { usePortfolioStore } from '@/store/portfolioStore';

export function AppLayout() {
  useWebSocket();
  const token = useAuthStore((s) => s.token);

  // Load the signed-in user's data once for every page, so e.g. a coin page opened directly
  // (or after a refresh) knows what's already in the watchlist.
  useEffect(() => {
    if (!token) return;
    useWatchlistStore.getState().fetch();
    useAlertStore.getState().fetch();
    usePortfolioStore.getState().fetch();
  }, [token]);

  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar />
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
