import { memo, useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface PriceCellProps {
  price: number;
  symbol?: string;
  className?: string;
}

function PriceCellImpl({ price, symbol, className = '' }: PriceCellProps) {
  const prevPrice = useRef(price);
  const [flashClass, setFlashClass] = useState('');
  const [arrow, setArrow] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price > prevPrice.current) {
      setFlashClass('animate-flash-up');
      setArrow('up');
    } else if (price < prevPrice.current) {
      setFlashClass('animate-flash-down');
      setArrow('down');
    }
    prevPrice.current = price;
    const timer = setTimeout(() => {
      setFlashClass('');
      setArrow(null);
    }, 600);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <div className={`tabular inline-flex items-center gap-1 ${flashClass} rounded px-1 ${className}`}>
      <NumberFlow
        value={price}
        format={{
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: price >= 1000 ? 2 : price >= 1 ? 4 : 6,
          maximumFractionDigits: price >= 1000 ? 2 : price >= 1 ? 4 : 6,
        }}
      />
      <AnimatePresence>
        {arrow && (
          <motion.span
            initial={{ opacity: 0, y: arrow === 'up' ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={arrow === 'up' ? 'text-up' : 'text-down'}
          >
            {arrow === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export const PriceCell = memo(PriceCellImpl);
