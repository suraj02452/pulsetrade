import { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Bell, BarChart3, Star, Zap } from 'lucide-react';
import { Sparkline } from '@/components/Sparkline';
import { PriceCell } from '@/components/PriceCell';
import { usePriceStore } from '@/store/priceStore';
import { mockEngine } from '@/services/mockEngine';
import { formatPercent } from '@/utils/format';
import { useRef } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const prices = usePriceStore((s) => s.prices);
  const fetchPrices = usePriceStore((s) => s.fetchPrices);
  const [tickerOffset, setTickerOffset] = useState(0);

  useEffect(() => {
    fetchPrices();
    mockEngine.start();
    const interval = setInterval(() => {
      setTickerOffset((o) => o - 1);
    }, 30);
    return () => {
      clearInterval(interval);
      mockEngine.stop();
    };
  }, [fetchPrices]);

  const priceList = Array.from(prices.values()).slice(0, 10);

  const features = [
    { icon: Zap, title: 'Real-Time Prices', desc: 'Live price feeds via WebSocket with sub-second updates for 15+ cryptocurrencies.' },
    { icon: Bell, title: 'Smart Alerts', desc: 'Set price alerts above or below thresholds. Get notified instantly when triggered.' },
    { icon: Star, title: 'Watchlist', desc: 'Track your favorite coins with a drag-to-reorder watchlist and live updates.' },
    { icon: BarChart3, title: 'Portfolio Tracking', desc: 'Monitor your holdings with live P&L, allocation charts, and profit calculations.' },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-100">PulseTrade</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-slate-300 hover:text-white px-3 py-2">
            Login
          </button>
          <button onClick={() => navigate('/register')} className="text-sm bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/10 border border-brand-600/30 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-up opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-up" />
              </span>
              <span className="text-xs font-medium text-brand-300">Live market data streaming</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-100 leading-tight tracking-tight">
              Trade the
              <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent"> pulse</span>
              <br />of the market
            </h1>
            <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
              Real-time cryptocurrency price tracking with live charts, smart alerts,
              and portfolio management. Stay ahead of every market move.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="group flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-slate-300 hover:text-white px-6 py-3 rounded-lg font-medium border border-bg-border hover:border-brand-500/50 transition-colors"
              >
                View Dashboard
              </button>
            </div>
          </motion.div>

          {/* Mini chart card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 max-w-2xl mx-auto card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted">BTC / USDT</div>
                {priceList[0] && <PriceCell price={priceList[0].price} className="text-2xl font-bold" />}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted">24h Change</div>
                {priceList[0] && (
                  <div className={`tabular text-lg font-medium ${priceList[0].change24h >= 0 ? 'text-up' : 'text-down'}`}>
                    {formatPercent(priceList[0].change24h)}
                  </div>
                )}
              </div>
            </div>
            {priceList[0] && (
              <Sparkline data={priceList[0].history} width={560} height={120} positive={priceList[0].change24h >= 0} />
            )}
          </motion.div>
        </div>
      </section>

      {/* Ticker tape */}
      <div className="border-y border-bg-border bg-bg-surface/50 py-3 overflow-hidden">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: tickerOffset }}
          transition={{ ease: 'linear' }}
        >
          {[...priceList, ...priceList, ...priceList].map((coin, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-300">{coin.symbol.replace('USDT', '')}</span>
              <span className="tabular text-slate-400">{coin.price.toFixed(2)}</span>
              <span className={`tabular text-xs ${coin.change24h >= 0 ? 'text-up' : 'text-down'}`}>
                {formatPercent(coin.change24h)}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features */}
      <section ref={ref} className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card p-6 hover:border-brand-500/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-600/10 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to start trading?</h2>
          <p className="text-slate-400 mb-8">Create a free account and start tracking your portfolio in minutes.</p>
          <button
            onClick={() => navigate('/register')}
            className="group inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-lg font-medium transition-all hover:scale-105"
          >
            Get Started Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      <footer className="border-t border-bg-border py-8 text-center text-sm text-muted">
        PulseTrade &copy; 2026 &mdash; Real-time crypto tracking
      </footer>
    </div>
  );
}
