import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import type { AlertCondition } from '@/types';
import { useAlertStore } from '@/store/alertStore';
import { usePriceStore } from '@/store/priceStore';

export function AlertForm({ defaultSymbol }: { defaultSymbol?: string }) {
  const create = useAlertStore((s) => s.create);
  const prices = usePriceStore((s) => s.prices);
  const symbols = Array.from(prices.values()).map((p) => p.symbol);

  const [symbol, setSymbol] = useState(defaultSymbol || symbols[0] || 'BTCUSDT');
  const [condition, setCondition] = useState<AlertCondition>('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) {
      setError('Enter a valid price');
      return;
    }
    await create(symbol, condition, price);
    setTargetPrice('');
    setError('');
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="card p-5 space-y-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Bell size={18} className="text-brand-400" />
        <h3 className="font-semibold text-slate-100">Create Alert</h3>
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">Coin</label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s.replace('USDT', '')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">Condition</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCondition('ABOVE')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              condition === 'ABOVE'
                ? 'bg-up/20 text-up border border-up/50'
                : 'bg-bg-surface text-muted border border-bg-border'
            }`}
          >
            Above
          </button>
          <button
            type="button"
            onClick={() => setCondition('BELOW')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              condition === 'BELOW'
                ? 'bg-down/20 text-down border border-down/50'
                : 'bg-bg-surface text-muted border border-bg-border'
            }`}
          >
            Below
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">Target Price (USD)</label>
        <input
          type="number"
          step="any"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="0.00"
          className="w-full bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-sm tabular text-slate-200 focus:border-brand-500 focus:outline-none"
        />
        {error && <p className="text-xs text-down mt-1">{error}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        Create Alert
      </button>
    </motion.form>
  );
}
