import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';
import { usePriceStore } from '@/store/priceStore';
import { useWatchlistStore } from '@/store/watchlistStore';
import { api } from '@/services/api';
import { PriceCell } from '@/components/PriceCell';
import { AlertForm } from '@/components/AlertForm';
import { Skeleton } from '@/components/Skeleton';
import { formatPrice, formatCompact, formatPercent } from '@/utils/format';
import type { CandlestickData, TimeRange } from '@/types';

const ranges: { label: string; value: TimeRange }[] = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
];

export function CoinDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const prices = usePriceStore((s) => s.prices);
  const inWatchlist = useWatchlistStore((s) => (symbol ? s.has(symbol) : false));
  const addToWatchlist = useWatchlistStore((s) => s.add);
  const removeFromWatchlist = useWatchlistStore((s) => s.remove);

  const [range, setRange] = useState<TimeRange>('24h');
  const [history, setHistory] = useState<CandlestickData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const coin = symbol ? prices.get(symbol) : undefined;

  useEffect(() => {
    if (!symbol) return;
    setHistoryLoading(true);
    api.getPriceHistory(symbol, range).then((data) => {
      setHistory(data);
      setHistoryLoading(false);
    });
  }, [symbol, range]);

  const chartData = useMemo(() => history.map((c) => c.close), [history]);
  const positive = coin ? coin.change24h >= 0 : true;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-muted hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center text-sm font-bold text-brand-300">
            {symbol?.slice(0, 3)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{symbol?.replace('USDT', '')}</h1>
            <p className="text-sm text-muted">{coin?.name}</p>
          </div>
        </div>
        <button
          onClick={() => (inWatchlist && symbol ? removeFromWatchlist(symbol) : symbol && addToWatchlist(symbol))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-bg-border hover:border-brand-500/50 transition-colors text-sm"
        >
          <Star size={16} className={inWatchlist ? 'fill-yellow-400 text-yellow-400' : 'text-muted'} />
          {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              {coin ? (
                <PriceCell price={coin.price} symbol={coin.symbol} className="text-3xl font-bold" />
              ) : (
                <Skeleton className="w-32 h-8" />
              )}
              <div className={`tabular text-sm mt-1 ${positive ? 'text-up' : 'text-down'}`}>
                {coin ? formatPercent(coin.change24h) : ''}
              </div>
            </div>
            <div className="flex gap-1">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    range === r.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-bg-surface text-muted hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {historyLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 600 256" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {(() => {
                  if (chartData.length < 2) return null;
                  const min = Math.min(...chartData);
                  const max = Math.max(...chartData);
                  const range = max - min || 1;
                  const step = 600 / (chartData.length - 1);
                  const linePath = chartData
                    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(2)} ${256 - ((v - min) / range) * 240}`)
                    .join(' ');
                  const areaPath = `${linePath} L 600 256 L 0 256 Z`;
                  return (
                    <>
                      <path d={areaPath} fill="url(#chart-grad)" />
                      <path d={linePath} fill="none" stroke={positive ? '#22c55e' : '#ef4444'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                })()}
              </svg>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-bg-border">
            <div>
              <div className="text-xs text-muted">24h High</div>
              <div className="tabular text-sm font-medium text-slate-200 mt-0.5">
                {coin ? formatPrice(coin.high24h, coin.symbol) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">24h Low</div>
              <div className="tabular text-sm font-medium text-slate-200 mt-0.5">
                {coin ? formatPrice(coin.low24h, coin.symbol) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">24h Volume</div>
              <div className="tabular text-sm font-medium text-slate-200 mt-0.5">
                {coin ? formatCompact(coin.volume24h) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Alert panel */}
        <div>
          <AlertForm defaultSymbol={symbol} />
        </div>
      </div>
    </div>
  );
}
