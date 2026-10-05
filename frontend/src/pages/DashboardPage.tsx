import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ArrowUpDown } from 'lucide-react';
import { usePrices } from '@/hooks/usePrices';
import { useWatchlistStore } from '@/store/watchlistStore';
import { useAlertStore } from '@/store/alertStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { usePriceStore } from '@/store/priceStore';
import { CoinRow } from '@/components/CoinRow';
import { StatCard } from '@/components/StatCard';
import { SkeletonRow } from '@/components/Skeleton';
import { formatPrice, formatPercent } from '@/utils/format';

type SortKey = 'price' | 'change24h' | 'name';

export function DashboardPage() {
  const { prices, loading } = usePrices();
  const watchlist = useWatchlistStore((s) => s.items);
  const alerts = useAlertStore((s) => s.alerts);
  const holdings = usePortfolioStore((s) => s.holdings);
  const fetchWatchlist = useWatchlistStore((s) => s.fetch);
  const fetchAlerts = useAlertStore((s) => s.fetch);
  const fetchHoldings = usePortfolioStore((s) => s.fetch);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('change24h');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    fetchWatchlist();
    fetchAlerts();
    fetchHoldings();
  }, [fetchWatchlist, fetchAlerts, fetchHoldings]);

  const priceList = useMemo(() => Array.from(prices.values()), [prices]);

  const filtered = useMemo(() => {
    let list = priceList;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.symbol.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'price') cmp = a.price - b.price;
      else if (sortKey === 'change24h') cmp = a.change24h - b.change24h;
      else cmp = a.name.localeCompare(b.name);
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [priceList, search, sortKey, sortDesc]);

  const portfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const price = prices.get(h.symbol)?.price || h.buyPrice;
      return sum + price * h.quantity;
    }, 0);
  }, [holdings, prices]);

  const portfolioChange = useMemo(() => {
    if (holdings.length === 0) return 0;
    const totalCost = holdings.reduce((sum, h) => sum + h.buyPrice * h.quantity, 0);
    if (totalCost === 0) return 0;
    return ((portfolioValue - totalCost) / totalCost) * 100;
  }, [holdings, portfolioValue]);

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE').length;

  const gainers = useMemo(() => [...priceList].sort((a, b) => b.change24h - a.change24h).slice(0, 3), [priceList]);
  const losers = useMemo(() => [...priceList].sort((a, b) => a.change24h - b.change24h).slice(0, 3), [priceList]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Portfolio Value" value={portfolioValue} changePercent={portfolioChange} icon="wallet" delay={0} />
        <StatCard label="24h Change" value={portfolioValue - holdings.reduce((s, h) => s + h.buyPrice * h.quantity, 0)} isCurrency icon="trend" delay={0.1} />
        <StatCard label="Active Alerts" value={activeAlerts} isCurrency={false} icon="bell" delay={0.2} />
      </div>

      {/* Gainers / Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-up mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-up" /> Top Gainers
          </h3>
          <div className="space-y-2">
            {gainers.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{coin.symbol.replace('USDT', '')}</span>
                <div className="flex items-center gap-3">
                  <span className="tabular text-slate-400">{formatPrice(coin.price, coin.symbol)}</span>
                  <span className="tabular text-up font-medium w-16 text-right">{formatPercent(coin.change24h)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-down mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-down" /> Top Losers
          </h3>
          <div className="space-y-2">
            {losers.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{coin.symbol.replace('USDT', '')}</span>
                <div className="flex items-center gap-3">
                  <span className="tabular text-slate-400">{formatPrice(coin.price, coin.symbol)}</span>
                  <span className="tabular text-down font-medium w-16 text-right">{formatPercent(coin.change24h)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
          <h3 className="font-semibold text-slate-100">Live Market</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coins..."
              className="bg-bg-surface border border-bg-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 focus:border-brand-500 focus:outline-none w-40 sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bg-border text-xs text-muted">
                <th className="text-left py-2 px-4 font-medium">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-slate-300">
                    Coin <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-right py-2 px-4 font-medium">
                  <button onClick={() => toggleSort('price')} className="flex items-center gap-1 hover:text-slate-300 ml-auto">
                    Price <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-right py-2 px-4 font-medium">
                  <button onClick={() => toggleSort('change24h')} className="flex items-center gap-1 hover:text-slate-300 ml-auto">
                    24h % <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-right py-2 px-4 font-medium hidden md:table-cell">Volume</th>
                <th className="text-right py-2 px-4 font-medium hidden sm:table-cell">Chart</th>
                <th className="py-2 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : filtered.map((coin, i) => <CoinRow key={coin.symbol} coin={coin} index={i} />)}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
