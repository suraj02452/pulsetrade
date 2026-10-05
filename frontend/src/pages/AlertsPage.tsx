import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Trash2, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { usePriceStore } from '@/store/priceStore';
import { AlertForm } from '@/components/AlertForm';
import { Skeleton } from '@/components/Skeleton';
import { formatPrice } from '@/utils/format';

export function AlertsPage() {
  const { alerts, loading, remove, rearm } = useAlerts();
  const prices = usePriceStore((s) => s.prices);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Price Alerts</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AlertForm />
        </div>

        <div className="lg:col-span-2 space-y-3">
          {loading && alerts.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full h-24" />)
          ) : alerts.length === 0 ? (
            <div className="card p-12 text-center">
              <Bell size={32} className="mx-auto text-muted mb-3" />
              <h3 className="text-lg font-medium text-slate-200 mb-1">No alerts set</h3>
              <p className="text-sm text-muted">Create an alert to get notified when prices hit your targets.</p>
            </div>
          ) : (
            <AnimatePresence>
              {alerts.map((alert) => {
                const currentPrice = prices.get(alert.symbol)?.price;
                const isTriggered = alert.status === 'TRIGGERED';
                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`card p-4 flex items-center gap-4 ${isTriggered ? 'opacity-60' : ''}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        alert.condition === 'ABOVE' ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
                      }`}
                    >
                      {alert.condition === 'ABOVE' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-100">{alert.symbol.replace('USDT', '')}</span>
                        <span className="text-xs text-muted">
                          {alert.condition === 'ABOVE' ? 'above' : 'below'}
                        </span>
                        <span className="tabular text-sm text-slate-300">
                          {formatPrice(alert.targetPrice, alert.symbol)}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        Current: {currentPrice ? formatPrice(currentPrice, alert.symbol) : '—'}
                        {isTriggered && alert.triggeredAt && ` · Triggered ${new Date(alert.triggeredAt).toLocaleTimeString()}`}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isTriggered
                          ? 'bg-muted/10 text-muted border border-muted/30'
                          : 'bg-up/10 text-up border border-up/30'
                      }`}
                    >
                      {alert.status}
                    </span>

                    <div className="flex gap-1">
                      {isTriggered && (
                        <button
                          onClick={() => rearm(alert.id)}
                          className="p-2 rounded-lg hover:bg-bg-hover text-muted hover:text-brand-400 transition-colors"
                          title="Re-arm alert"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(alert.id)}
                        className="p-2 rounded-lg hover:bg-bg-hover text-muted hover:text-down transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
