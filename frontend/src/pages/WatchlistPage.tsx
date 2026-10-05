import { useEffect, useState } from 'react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Star } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlistStore';
import { usePriceStore } from '@/store/priceStore';
import { PriceCell } from '@/components/PriceCell';
import { Sparkline } from '@/components/Sparkline';
import { Skeleton } from '@/components/Skeleton';
import { formatPercent } from '@/utils/format';

export function WatchlistPage() {
  const { items, loading, fetch, remove, reorder } = useWatchlistStore();
  const prices = usePriceStore((s) => s.prices);
  const navigate = useNavigate();
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    setSymbols(items.map((i) => i.symbol));
  }, [items]);

  const handleReorder = (newSymbols: string[]) => {
    setSymbols(newSymbols);
    reorder(newSymbols);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Watchlist</h1>
        <span className="text-sm text-muted">{items.length} coins</span>
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-20" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Star size={32} className="mx-auto text-muted mb-3" />
          <h3 className="text-lg font-medium text-slate-200 mb-1">No coins in watchlist</h3>
          <p className="text-sm text-muted mb-4">Add coins from the dashboard to start tracking them here.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Browse Coins
          </button>
        </div>
      ) : (
        <Reorder.Group axis="y" values={symbols} onReorder={handleReorder} className="space-y-2">
          <AnimatePresence>
            {symbols.map((symbol) => {
              const coin = prices.get(symbol);
              if (!coin) return null;
              const positive = coin.change24h >= 0;
              return (
                <Reorder.Item
                  key={symbol}
                  value={symbol}
                  className="card p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing list-none"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                >
                  <GripVertical size={18} className="text-muted flex-shrink-0" />

                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => navigate(`/coin/${symbol}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center text-xs font-bold text-brand-300">
                      {symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">{symbol.replace('USDT', '')}</div>
                      <div className="text-xs text-muted">{coin.name}</div>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <Sparkline data={coin.history} positive={positive} width={80} height={28} />
                  </div>

                  <div className="text-right">
                    <PriceCell price={coin.price} symbol={symbol} />
                    <div className={`tabular text-xs mt-0.5 ${positive ? 'text-up' : 'text-down'}`}>
                      {formatPercent(coin.change24h)}
                    </div>
                  </div>

                  <button
                    onClick={() => remove(symbol)}
                    className="p-2 rounded-lg hover:bg-bg-hover text-muted hover:text-down transition-colors"
                  >
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  </button>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  );
}
