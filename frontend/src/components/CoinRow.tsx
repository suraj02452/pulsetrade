import { memo } from 'react';
import { motion } from 'framer-motion';
import { Star, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Price } from '@/types';
import { PriceCell } from './PriceCell';
import { Sparkline } from './Sparkline';
import { formatPercent, formatCompact } from '@/utils/format';
import { useWatchlistStore } from '@/store/watchlistStore';

interface CoinRowProps {
  coin: Price;
  index: number;
}

function CoinRowImpl({ coin, index }: CoinRowProps) {
  const navigate = useNavigate();
  const inWatchlist = useWatchlistStore((s) => s.has(coin.symbol));
  const addToWatchlist = useWatchlistStore((s) => s.add);
  const removeFromWatchlist = useWatchlistStore((s) => s.remove);

  const positive = coin.change24h >= 0;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-b border-bg-border hover:bg-bg-hover/50 cursor-pointer transition-colors group"
      onClick={() => navigate(`/coin/${coin.symbol}`)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center text-xs font-bold text-brand-300">
            {coin.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="font-medium text-slate-100">{coin.symbol.replace('USDT', '')}</div>
            <div className="text-xs text-muted">{coin.name}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <PriceCell price={coin.price} symbol={coin.symbol} />
      </td>
      <td className={`py-3 px-4 text-right tabular font-medium ${positive ? 'text-up' : 'text-down'}`}>
        {formatPercent(coin.change24h)}
      </td>
      <td className="py-3 px-4 text-right tabular text-slate-400 hidden md:table-cell">
        {formatCompact(coin.volume24h)}
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="flex justify-end">
          <Sparkline data={coin.history} positive={positive} width={80} height={28} />
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            inWatchlist ? removeFromWatchlist(coin.symbol) : addToWatchlist(coin.symbol);
          }}
          className="p-1.5 rounded-lg hover:bg-bg-surface transition-colors"
        >
          <Star
            size={16}
            className={inWatchlist ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}
          />
        </button>
      </td>
    </motion.tr>
  );
}

export const CoinRow = memo(CoinRowImpl);
