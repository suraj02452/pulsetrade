import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CoinDetailPage } from '@/pages/CoinDetailPage';
import { WatchlistPage } from '@/pages/WatchlistPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { mockEngine } from '@/services/mockEngine';
import { api, SESSION_EXPIRED_EVENT } from '@/services/api';
import { logoutAndClearSession } from '@/store/session';
import { USE_MOCK } from '@/utils/constants';
import { toast } from 'sonner';
import { Bell, LogIn } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Keeps a remembered session honest: on startup the saved token is checked with the backend, and any
 * 401 later on (token expired or tampered with) logs the user out and sends them to the login page.
 */
function SessionGuard() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const onExpired = () => {
      if (!useAuthStore.getState().isAuthenticated) return;
      logoutAndClearSession();
      toast.custom(
        () => (
          <div className="flex items-center gap-3 bg-bg-card border border-red-500/30 rounded-xl px-4 py-3 shadow-2xl">
            <LogIn size={20} className="text-red-400" />
            <div>
              <div className="font-medium text-slate-100 text-sm">Session expired</div>
              <div className="text-xs text-muted">Please log in again.</div>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
      navigate('/login', { replace: true });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [navigate]);

  useEffect(() => {
    if (USE_MOCK || !token) return;
    // A 401 here fires SESSION_EXPIRED_EVENT; other failures (e.g. backend offline) keep the session.
    api.getMe(token).then(setUser).catch(() => undefined);
    // Only on startup / when a new token is set.
  }, [token, setUser]);

  return null;
}

function AlertToaster() {
  const notifications = useNotificationStore((s) => s.notifications);
  const lastNotif = notifications[0];

  useEffect(() => {
    if (lastNotif) {
      toast.custom(
        () => (
          <div className="flex items-center gap-3 bg-bg-card border border-brand-500/30 rounded-xl px-4 py-3 shadow-2xl">
            <Bell size={20} className="text-brand-400 animate-shake" />
            <div>
              <div className="font-medium text-slate-100 text-sm">{lastNotif.symbol.replace('USDT', '')} Alert Triggered</div>
              <div className="text-xs text-muted">{lastNotif.message}</div>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    }
  }, [lastNotif]);

  return null;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (USE_MOCK && !isAuthenticated) {
      mockEngine.start();
      return () => mockEngine.stop();
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/coin/:symbol" element={<CoinDetailPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: '',
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0,
          },
        }}
      />
      <AlertToaster />
      <SessionGuard />
    </BrowserRouter>
  );
}
