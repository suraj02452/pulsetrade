import type {
  Price,
  PriceUpdate,
  Alert,
  AlertPayload,
  WatchlistItem,
  Holding,
  User,
  AuthResponse,
  CandlestickData,
  TimeRange,
} from '@/types';
import { COINS } from '@/utils/constants';

function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function randomWalk(prev: number, volatility = 0.002): number {
  const change = (Math.random() - 0.5) * 2 * volatility * prev;
  return Math.max(0.0001, prev + change);
}

function genHistory(base: number, points = 60): number[] {
  const arr: number[] = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    val = randomWalk(val, 0.003);
    arr.push(val);
  }
  return arr;
}

class MockEngine {
  private prices: Map<string, Price> = new Map();
  private listeners: Set<(update: PriceUpdate) => void> = new Set();
  private alertListeners: Set<(payload: AlertPayload) => void> = new Set();
  private interval: ReturnType<typeof setInterval> | null = null;
  private alertInterval: ReturnType<typeof setInterval> | null = null;
  private alerts: Alert[] = [];
  private watchlist: WatchlistItem[] = [];
  private holdings: Holding[] = [];
  private users: Map<string, { password: string; user: User }> = new Map();
  private currentToken: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.initPrices();
  }

  private initPrices() {
    for (const coin of COINS) {
      const history = genHistory(coin.basePrice, 60);
      const high = Math.max(...history);
      const low = Math.min(...history);
      const open = history[0];
      const change = ((coin.basePrice - open) / open) * 100;
      this.prices.set(coin.symbol, {
        symbol: coin.symbol,
        name: coin.name,
        price: coin.basePrice,
        change24h: change,
        high24h: high,
        low24h: low,
        volume24h: Math.random() * 1e9 + 1e7,
        timestamp: Date.now(),
        history,
      });
    }
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      for (const [symbol, p] of this.prices) {
        const newPrice = randomWalk(p.price, 0.002);
        const open = p.history[0];
        const change = ((newPrice - open) / open) * 100;
        const high = Math.max(p.high24h, newPrice);
        const low = Math.min(p.low24h, newPrice);
        const history = [...p.history.slice(-59), newPrice];
        this.prices.set(symbol, {
          ...p,
          price: newPrice,
          change24h: change,
          high24h: high,
          low24h: low,
          history,
          timestamp: Date.now(),
        });
        this.listeners.forEach((cb) =>
          cb({ symbol, price: newPrice, change24h: change, timestamp: Date.now() })
        );
      }
      this.checkAlerts();
    }, 1000);

    this.alertInterval = setInterval(() => {
      this.triggerRandomAlert();
    }, 30000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.alertInterval) clearInterval(this.alertInterval);
    this.interval = null;
    this.alertInterval = null;
  }

  onPriceUpdate(cb: (update: PriceUpdate) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  onAlertTriggered(cb: (payload: AlertPayload) => void): () => void {
    this.alertListeners.add(cb);
    return () => this.alertListeners.delete(cb);
  }

  getPrices(): Price[] {
    return Array.from(this.prices.values());
  }

  getPrice(symbol: string): Price | undefined {
    return this.prices.get(symbol);
  }

  getHistory(symbol: string, range: TimeRange): CandlestickData[] {
    const price = this.prices.get(symbol);
    if (!price) return [];
    const points = range === '1h' ? 30 : range === '24h' ? 48 : 84;
    const intervalMs = range === '1h' ? 2 * 60 * 1000 : range === '24h' ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const now = Date.now();
    const result: CandlestickData[] = [];
    let val = price.history[0];
    for (let i = points; i >= 0; i--) {
      const open = val;
      const close = randomWalk(val, 0.004);
      const high = Math.max(open, close) * (1 + Math.random() * 0.002);
      const low = Math.min(open, close) * (1 - Math.random() * 0.002);
      result.push({
        time: now - i * intervalMs,
        open,
        high,
        low,
        close,
      });
      val = close;
    }
    return result;
  }

  // Auth
  register(email: string, password: string, username: string): AuthResponse {
    if (this.users.has(email)) throw new Error('Email already registered');
    const user: User = { id: uid(), email, username };
    this.users.set(email, { password, user });
    const token = `mock-token-${uid()}`;
    this.currentToken = token;
    this.currentUser = user;
    return { token, user };
  }

  login(email: string, password: string): AuthResponse {
    const record = this.users.get(email);
    if (!record || record.password !== password) throw new Error('Invalid credentials');
    const token = `mock-token-${uid()}`;
    this.currentToken = token;
    this.currentUser = record.user;
    return { token, user: record.user };
  }

  getUser(): User | null {
    return this.currentUser;
  }

  // Alerts
  getAlerts(): Alert[] {
    return this.alerts;
  }

  createAlert(symbol: string, condition: 'ABOVE' | 'BELOW', targetPrice: number): Alert {
    const alert: Alert = {
      id: uid(),
      symbol,
      condition,
      targetPrice,
      status: 'ACTIVE',
      createdAt: Date.now(),
    };
    this.alerts.unshift(alert);
    return alert;
  }

  deleteAlert(id: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== id);
  }

  rearmAlert(id: string): void {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'ACTIVE';
      alert.triggeredAt = undefined;
    }
  }

  private checkAlerts() {
    for (const alert of this.alerts) {
      if (alert.status !== 'ACTIVE') continue;
      const price = this.prices.get(alert.symbol);
      if (!price) continue;
      const triggered =
        alert.condition === 'ABOVE'
          ? price.price >= alert.targetPrice
          : price.price <= alert.targetPrice;
      if (triggered) {
        alert.status = 'TRIGGERED';
        alert.triggeredAt = Date.now();
        alert.currentPrice = price.price;
        const message =
          alert.condition === 'ABOVE'
            ? `${alert.symbol.replace('USDT', '')} rose above ${alert.targetPrice}`
            : `${alert.symbol.replace('USDT', '')} dropped below ${alert.targetPrice}`;
        const payload: AlertPayload = {
          alertId: alert.id,
          symbol: alert.symbol,
          condition: alert.condition,
          targetPrice: alert.targetPrice,
          currentPrice: price.price,
          message,
        };
        this.alertListeners.forEach((cb) => cb(payload));
      }
    }
  }

  private triggerRandomAlert() {
    const symbols = Array.from(this.prices.keys());
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const price = this.prices.get(symbol)!;
    const condition = Math.random() > 0.5 ? 'ABOVE' : 'BELOW';
    const targetPrice =
      condition === 'ABOVE'
        ? price.price * 1.001
        : price.price * 0.999;
    const message =
      condition === 'ABOVE'
        ? `${symbol.replace('USDT', '')} rose above ${targetPrice.toFixed(2)}`
        : `${symbol.replace('USDT', '')} dropped below ${targetPrice.toFixed(2)}`;
    const payload: AlertPayload = {
      alertId: uid(),
      symbol,
      condition,
      targetPrice,
      currentPrice: price.price,
      message,
    };
    this.alertListeners.forEach((cb) => cb(payload));
  }

  // Watchlist
  getWatchlist(): WatchlistItem[] {
    return this.watchlist;
  }

  addToWatchlist(symbol: string): WatchlistItem {
    if (this.watchlist.some((w) => w.symbol === symbol)) return this.watchlist.find((w) => w.symbol === symbol)!;
    const item: WatchlistItem = { symbol, addedAt: Date.now() };
    this.watchlist.push(item);
    return item;
  }

  removeFromWatchlist(symbol: string): void {
    this.watchlist = this.watchlist.filter((w) => w.symbol !== symbol);
  }

  reorderWatchlist(symbols: string[]): void {
    this.watchlist = symbols.map((s) => this.watchlist.find((w) => w.symbol === s)!).filter(Boolean);
  }

  // Portfolio
  getHoldings(): Holding[] {
    return this.holdings;
  }

  addHolding(symbol: string, quantity: number, buyPrice: number): Holding {
    const holding: Holding = { id: uid(), symbol, quantity, buyPrice, addedAt: Date.now() };
    this.holdings.push(holding);
    return holding;
  }

  deleteHolding(id: string): void {
    this.holdings = this.holdings.filter((h) => h.id !== id);
  }
}

export const mockEngine = new MockEngine();
