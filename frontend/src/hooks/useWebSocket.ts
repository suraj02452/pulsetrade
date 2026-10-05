import { useEffect, useRef, useCallback } from 'react';
import type { PriceUpdate, AlertPayload, ConnectionStatus } from '@/types';
import { createPriceSubscriber } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { usePriceStore } from '@/store/priceStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAlertStore } from '@/store/alertStore';

export function useWebSocket() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const applyUpdate = usePriceStore((s) => s.applyUpdate);
  const setConnectionStatus = usePriceStore((s) => s.setConnectionStatus);
  const addNotification = useNotificationStore((s) => s.add);
  const markTriggered = useAlertStore((s) => s.markTriggered);
  const subscriberRef = useRef<ReturnType<typeof createPriceSubscriber> | null>(null);

  const handleAlert = useCallback(
    (payload: AlertPayload) => {
      addNotification({
        alertId: payload.alertId,
        symbol: payload.symbol,
        message: payload.message,
        timestamp: Date.now(),
      });
      markTriggered(payload.alertId, payload.currentPrice, payload.message);
    },
    [addNotification, markTriggered]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const subscriber = createPriceSubscriber(token);
    subscriberRef.current = subscriber;

    const unsubPrices = subscriber.onPriceUpdate((update: PriceUpdate) => {
      applyUpdate(update);
    });

    const unsubAlerts = subscriber.onAlertTriggered((payload: AlertPayload) => {
      handleAlert(payload);
    });

    // The LIVE badge follows the real connection: connected, reconnecting or disconnected.
    const unsubStatus = subscriber.onStatusChange((status: ConnectionStatus) => {
      setConnectionStatus(status);
    });

    subscriber.connect();

    return () => {
      unsubPrices();
      unsubAlerts();
      subscriber.disconnect();
      unsubStatus();
      setConnectionStatus('disconnected');
    };
  }, [isAuthenticated, token, applyUpdate, setConnectionStatus, handleAlert]);

  return usePriceStore((s) => s.connectionStatus);
}
