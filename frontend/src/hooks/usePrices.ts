import { useEffect } from 'react';
import { usePriceStore } from '@/store/priceStore';

export function usePrices() {
  const prices = usePriceStore((s) => s.prices);
  const loading = usePriceStore((s) => s.loading);
  const fetchPrices = usePriceStore((s) => s.fetchPrices);
  const connectionStatus = usePriceStore((s) => s.connectionStatus);

  useEffect(() => {
    if (prices.size === 0 && loading) {
      fetchPrices();
    }
  }, [prices.size, loading, fetchPrices]);

  return { prices, loading, connectionStatus };
}
