import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, PieChart as PieChartIcon, Wallet } from 'lucide-react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { usePriceStore } from '@/store/priceStore';
import { PriceCell } from '@/components/PriceCell';
import { Skeleton } from '@/components/Skeleton';
import { formatPrice, formatPercent, formatCurrency } from '@/utils/format';
import { COINS } from '@/utils/constants';

export function PortfolioPage() {
  const { holdings, loading, fetch, add, remove } = usePortfolioStore();
  const prices = usePriceStore((s) => s.prices);
  const [showForm, setShowForm] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  useEffect(() => {
    fetch();
  }, [fetch]);

  const holdingsWithValue = useMemo(
    () =>
      holdings.map((h) => {
        const currentPrice = prices.get(h.symbol)?.price || h.buyPrice;
        const value = currentPrice * h.quantity;
        const cost = h.buyPrice * h.quantity;
        const pnl = value - cost;
        const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
        return { ...h, currentPrice, value, cost, pnl, pnlPercent };
      }),
    [holdings, prices]
  );

  const totalValue = holdingsWithValue.reduce((s, h) => s + h.value, 0);
  const totalCost = holdingsWithValue.reduce((s, h) => s + h.cost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Donut chart data
  const allocation = useMemo(() => {
    if (totalValue === 0) return [];
    return holdingsWithValue.map((h) => ({
      symbol: h.symbol,
      percentage: (h.value / totalValue) * 100,
      color: `hsl(${holdingsWithValue.indexOf(h) * 47}, 70%, 50%)`,
    }));
  }, [holdingsWithValue, totalValue]);

  const donutSegments = useMemo(() => {
    if (allocation.length === 0) return [];
    let offset = 0;
    return allocation.map((a) => {
      const dash = (a.percentage / 100) * 251.2; // 2 * PI * 40
      const seg = { ...a, dasharray: `${dash} ${251.2 - dash}`, dashoffset: -offset };
      offset += dash;
      return seg;
    });
  }, [allocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const price = parseFloat(buyPrice);
    if (!qty || !price || qty <= 0 || price <= 0) return;
    await add(symbol, qty, price);
    setQuantity('');
    setBuyPrice('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Portfolio</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Holding
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-muted mb-1">Total Value</div>
          <div className="tabular text-2xl font-bold text-slate-100">
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-muted mb-1">Total P&L</div>
          <div className={`tabular text-2xl font-bold ${totalPnl >= 0 ? 'text-up' : 'text-down'}`}>
            {formatCurrency(totalPnl)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-muted mb-1">P&L %</div>
          <div className={`tabular text-2xl font-bold ${totalPnlPercent >= 0 ? 'text-up' : 'text-down'}`}>
            {formatPercent(totalPnlPercent)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border">
            <h3 className="font-semibold text-slate-100">Holdings</h3>
          </div>
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleSubmit}
                className="px-4 py-3 border-b border-bg-border bg-bg-surface/50 overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
                  >
                    {COINS.map((c) => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.symbol.replace('USDT', '')}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm tabular text-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    step="any"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Buy Price"
                    className="bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm tabular text-slate-200 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="mt-2 w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Add to Portfolio
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {loading && holdings.length === 0 ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-full h-16" />)}
            </div>
          ) : holdingsWithValue.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet size={32} className="mx-auto text-muted mb-3" />
              <h3 className="text-lg font-medium text-slate-200 mb-1">No holdings yet</h3>
              <p className="text-sm text-muted">Add your first holding to start tracking P&L.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-bg-border text-xs text-muted">
                    <th className="text-left py-2 px-4 font-medium">Coin</th>
                    <th className="text-right py-2 px-4 font-medium">Qty</th>
                    <th className="text-right py-2 px-4 font-medium">Buy Price</th>
                    <th className="text-right py-2 px-4 font-medium">Current</th>
                    <th className="text-right py-2 px-4 font-medium">Value</th>
                    <th className="text-right py-2 px-4 font-medium">P&L</th>
                    <th className="py-2 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {holdingsWithValue.map((h) => (
                      <motion.tr
                        key={h.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-bg-border hover:bg-bg-hover/50"
                      >
                        <td className="py-3 px-4 font-medium text-slate-100">{h.symbol.replace('USDT', '')}</td>
                        <td className="py-3 px-4 text-right tabular text-slate-300">{h.quantity}</td>
                        <td className="py-3 px-4 text-right tabular text-slate-400">{formatPrice(h.buyPrice, h.symbol)}</td>
                        <td className="py-3 px-4 text-right"><PriceCell price={h.currentPrice} symbol={h.symbol} /></td>
                        <td className="py-3 px-4 text-right tabular text-slate-200">{formatCurrency(h.value)}</td>
                        <td className={`py-3 px-4 text-right tabular font-medium ${h.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                          {formatCurrency(h.pnl)}
                          <div className="text-xs">{formatPercent(h.pnlPercent)}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => remove(h.id)}
                            className="p-1.5 rounded-lg hover:bg-bg-hover text-muted hover:text-down transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Donut chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-brand-400" /> Allocation
          </h3>
          {allocation.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted">No data</div>
          ) : (
            <div className="flex flex-col items-center">
              <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#25304d" strokeWidth="12" />
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={seg.dasharray}
                    strokeDashoffset={seg.dashoffset}
                  />
                ))}
              </svg>
              <div className="mt-4 space-y-2 w-full">
                {allocation.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="text-slate-300">{a.symbol.replace('USDT', '')}</span>
                    </div>
                    <span className="tabular text-muted">{a.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
