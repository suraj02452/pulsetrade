import { useEffect } from 'react';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';

export function useAlerts() {
  const alerts = useAlertStore((s) => s.alerts);
  const loading = useAlertStore((s) => s.loading);
  const fetch = useAlertStore((s) => s.fetch);
  const create = useAlertStore((s) => s.create);
  const remove = useAlertStore((s) => s.remove);
  const rearm = useAlertStore((s) => s.rearm);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) fetch();
  }, [isAuthenticated, fetch]);

  return { alerts, loading, create, remove, rearm };
}
