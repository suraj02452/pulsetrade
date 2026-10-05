import { useAuthStore } from './authStore';
import { useAlertStore } from './alertStore';
import { useWatchlistStore } from './watchlistStore';
import { usePortfolioStore } from './portfolioStore';
import { useNotificationStore } from './notificationStore';

/**
 * Logs out and wipes everything that belonged to the previous user, so the next person
 * using this browser never sees their alerts, watchlist, holdings or notifications.
 */
export function logoutAndClearSession() {
  useAuthStore.getState().logout();
  useAlertStore.setState({ alerts: [] });
  useWatchlistStore.setState({ items: [] });
  usePortfolioStore.setState({ holdings: [] });
  useNotificationStore.getState().clear();
}
