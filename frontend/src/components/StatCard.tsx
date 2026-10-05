import { memo } from 'react';
import NumberFlow from '@number-flow/react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Bell, Wallet } from 'lucide-react';
import { formatPercent } from '@/utils/format';

interface StatCardProps {
  label: string;
  value: number;
  changePercent?: number;
  icon?: 'wallet' | 'trend' | 'bell';
  isCurrency?: boolean;
  delay?: number;
}

function StatCardImpl({ label, value, changePercent, icon = 'wallet', isCurrency = true, delay = 0 }: StatCardProps) {
  const icons = {
    wallet: Wallet,
    trend: changePercent !== undefined && changePercent >= 0 ? TrendingUp : TrendingDown,
    bell: Bell,
  };
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card p-5 relative overflow-hidden group hover:border-brand-500/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted font-medium">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-bg-surface flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
          <Icon size={18} />
        </div>
      </div>
      <div className="tabular text-2xl font-bold text-slate-100">
        {isCurrency ? (
          <NumberFlow
            value={value}
            format={{
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
          />
        ) : (
          <NumberFlow value={value} />
        )}
      </div>
      {changePercent !== undefined && (
        <div className={`tabular text-sm font-medium mt-1 ${changePercent >= 0 ? 'text-up' : 'text-down'}`}>
          {formatPercent(changePercent)}
        </div>
      )}
    </motion.div>
  );
}

export const StatCard = memo(StatCardImpl);
