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
  AlertCondition,
  AlertStatus,
  ConnectionStatus,
} from '@/types';
import { API_URL, WS_URL, USE_MOCK, coinName } from '@/utils/constants';
import { mockEngine } from './mockEngine';

export interface PriceSubscriber {
  onPriceUpdate: (cb: (update: PriceUpdate) => void) => () => void;
  onAlertTriggered: (cb: (payload: AlertPayload) => void) => () => void;
  onStatusChange: (cb: (status: ConnectionStatus) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

/* ------------------------------------------------------------------ */
/* Backend (Spring Boot) response shapes                               */
/* ------------------------------------------------------------------ */

interface ApiUser { id: number; email: string; name: string | null; createdAt: string }
interface ApiAuthResponse { token: string; user: ApiUser }
interface ApiPriceTick {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  timestamp: number;
}
interface ApiWatchlistItem { id: number; symbol: string; position: number; addedAt: string }
interface ApiAlert {
  id: number;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  status: AlertStatus;
  createdAt: string;
  triggeredAt: string | null;
  triggeredPrice: number | null;
}
interface ApiHolding { id: number; symbol: string; quantity: number; buyPrice: number; createdAt: string }
interface ApiAlertEvent {
  alertId: number;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
  message: string;
}
interface ApiError { message?: string; fieldErrors?: Record<string, string> }

/* ------------------------------------------------------------------ */
/* Mapping backend JSON -> frontend types                              */
/* ------------------------------------------------------------------ */

const toMillis = (iso: string | null | undefined) => (iso ? Date.parse(iso) : undefined);

const toUser = (u: ApiUser): User => ({
  id: String(u.id),
  email: u.email,
  username: u.name || u.email.split('@')[0],
});

const toAuth = (r: ApiAuthResponse): AuthResponse => ({ token: r.token, user: toUser(r.user) });

const toPriceUpdate = (t: ApiPriceTick): PriceUpdate => ({
  symbol: t.symbol,
  price: t.price,
  change24h: t.change24h,
  high24h: t.high24h ?? undefined,
  low24h: t.low24h ?? undefined,
  volume24h: t.volume24h ?? undefined,
  timestamp: t.timestamp,
});

const toPrice = (t: ApiPriceTick): Price => ({
  symbol: t.symbol,
  name: coinName(t.symbol),
  price: t.price,
  change24h: t.change24h,
  high24h: t.high24h ?? t.price,
  low24h: t.low24h ?? t.price,
  volume24h: t.volume24h ?? 0,
  timestamp: t.timestamp,
  history: [t.price], // the sparkline fills in as live ticks arrive
});

const toWatchlistItem = (w: ApiWatchlistItem): WatchlistItem => ({
  symbol: w.symbol,
  addedAt: toMillis(w.addedAt) ?? Date.now(),
});

const toAlert = (a: ApiAlert): Alert => ({
  id: String(a.id),
  symbol: a.symbol,
  condition: a.condition,
  targetPrice: a.targetPrice,
  status: a.status,
  createdAt: toMillis(a.createdAt) ?? Date.now(),
  triggeredAt: toMillis(a.triggeredAt),
  currentPrice: a.triggeredPrice ?? undefined,
});

const toHolding = (h: ApiHolding): Holding => ({
  id: String(h.id),
  symbol: h.symbol,
  quantity: h.quantity,
  buyPrice: h.buyPrice,
  addedAt: toMillis(h.createdAt) ?? Date.now(),
});

const toAlertPayload = (e: ApiAlertEvent): AlertPayload => ({
  alertId: String(e.alertId),
  symbol: e.symbol,
  condition: e.condition,
  targetPrice: e.targetPrice,
  currentPrice: e.currentPrice,
  message: e.message,
});

/* ------------------------------------------------------------------ */
/* HTTP helper                                                         */
/* ------------------------------------------------------------------ */

/** Fired on window when an authenticated request gets 401, i.e. the saved token expired or is invalid. */
export const SESSION_EXPIRED_EVENT = 'pulsetrade:session-expired';

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null; fallbackError: string }
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on ' + API_URL + '?');
  }

  if (res.status === 401 && options.token) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new Error('Your session has expired. Please log in again.');
  }
  if (!res.ok) {
    let message = options.fallbackError;
    try {
      const err = (await res.json()) as ApiError;
      const firstField = err.fieldErrors && Object.entries(err.fieldErrors)[0];
      if (firstField) message = `${firstField[0]} ${firstField[1]}`;
      else if (err.message) message = err.message;
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const api = {
  // Auth
  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    if (USE_MOCK) return mockEngine.register(email, password, username);
    const res = await request<ApiAuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { name: username, email, password },
      fallbackError: 'Registration failed',
    });
    return toAuth(res);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) return mockEngine.login(email, password);
    const res = await request<ApiAuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      fallbackError: 'Login failed',
    });
    return toAuth(res);
  },

  /** Validates a saved token and returns the current user (401 if the token is expired or invalid). */
  async getMe(token: string): Promise<User> {
    const user = await request<ApiUser>('/api/users/me', { token, fallbackError: 'Failed to load your profile' });
    return toUser(user);
  },

  // Prices (public)
  async getPrices(): Promise<Price[]> {
    if (USE_MOCK) return mockEngine.getPrices();
    const ticks = await request<ApiPriceTick[]>('/api/prices', { fallbackError: 'Failed to fetch prices' });
    return ticks.map(toPrice);
  },

  async getPriceHistory(symbol: string, range: TimeRange): Promise<CandlestickData[]> {
    if (USE_MOCK) return mockEngine.getHistory(symbol, range);
    // The backend already returns { time, open, high, low, close } with time in epoch milliseconds.
    return request<CandlestickData[]>(`/api/prices/${symbol}/history?range=${range}`, {
      fallbackError: 'Failed to fetch history',
    });
  },

  // Watchlist
  async getWatchlist(token: string): Promise<WatchlistItem[]> {
    if (USE_MOCK) return mockEngine.getWatchlist();
    const items = await request<ApiWatchlistItem[]>('/api/watchlist', {
      token,
      fallbackError: 'Failed to fetch watchlist',
    });
    return items.map(toWatchlistItem);
  },

  async addToWatchlist(token: string, symbol: string): Promise<WatchlistItem> {
    if (USE_MOCK) return mockEngine.addToWatchlist(symbol);
    const item = await request<ApiWatchlistItem>('/api/watchlist', {
      method: 'POST',
      token,
      body: { symbol },
      fallbackError: 'Failed to add to watchlist',
    });
    return toWatchlistItem(item);
  },

  async removeFromWatchlist(token: string, symbol: string): Promise<void> {
    if (USE_MOCK) {
      mockEngine.removeFromWatchlist(symbol);
      return;
    }
    await request<void>(`/api/watchlist/${symbol}`, {
      method: 'DELETE',
      token,
      fallbackError: 'Failed to remove from watchlist',
    });
  },

  async reorderWatchlist(token: string, symbols: string[]): Promise<void> {
    if (USE_MOCK) return;
    await request<ApiWatchlistItem[]>('/api/watchlist/order', {
      method: 'PUT',
      token,
      body: { symbols },
      fallbackError: 'Failed to save watchlist order',
    });
  },

  // Alerts
  async getAlerts(token: string): Promise<Alert[]> {
    if (USE_MOCK) return mockEngine.getAlerts();
    const alerts = await request<ApiAlert[]>('/api/alerts', { token, fallbackError: 'Failed to fetch alerts' });
    return alerts.map(toAlert);
  },

  async createAlert(
    token: string,
    symbol: string,
    condition: AlertCondition,
    targetPrice: number
  ): Promise<Alert> {
    if (USE_MOCK) return mockEngine.createAlert(symbol, condition, targetPrice);
    const alert = await request<ApiAlert>('/api/alerts', {
      method: 'POST',
      token,
      body: { symbol, condition, targetPrice },
      fallbackError: 'Failed to create alert',
    });
    return toAlert(alert);
  },

  async deleteAlert(token: string, id: string): Promise<void> {
    if (USE_MOCK) {
      mockEngine.deleteAlert(id);
      return;
    }
    await request<void>(`/api/alerts/${id}`, { method: 'DELETE', token, fallbackError: 'Failed to delete alert' });
  },

  async rearmAlert(token: string, id: string): Promise<void> {
    if (USE_MOCK) {
      mockEngine.rearmAlert(id);
      return;
    }
    await request<ApiAlert>(`/api/alerts/${id}/rearm`, {
      method: 'PATCH',
      token,
      fallbackError: 'Failed to re-arm alert',
    });
  },

  // Portfolio
  async getHoldings(token: string): Promise<Holding[]> {
    if (USE_MOCK) return mockEngine.getHoldings();
    const holdings = await request<ApiHolding[]>('/api/portfolio', {
      token,
      fallbackError: 'Failed to fetch holdings',
    });
    return holdings.map(toHolding);
  },

  async addHolding(token: string, symbol: string, quantity: number, buyPrice: number): Promise<Holding> {
    if (USE_MOCK) return mockEngine.addHolding(symbol, quantity, buyPrice);
    const holding = await request<ApiHolding>('/api/portfolio', {
      method: 'POST',
      token,
      body: { symbol, quantity, buyPrice },
      fallbackError: 'Failed to add holding',
    });
    return toHolding(holding);
  },

  async deleteHolding(token: string, id: string): Promise<void> {
    if (USE_MOCK) {
      mockEngine.deleteHolding(id);
      return;
    }
    await request<void>(`/api/portfolio/${id}`, { method: 'DELETE', token, fallbackError: 'Failed to delete holding' });
  },
};

/* ------------------------------------------------------------------ */
/* Live updates over STOMP / SockJS                                    */
/* ------------------------------------------------------------------ */

export function createPriceSubscriber(token: string | null): PriceSubscriber {
  const listeners = new Set<(u: PriceUpdate) => void>();
  const alertListeners = new Set<(p: AlertPayload) => void>();
  const statusListeners = new Set<(s: ConnectionStatus) => void>();
  const emitStatus = (s: ConnectionStatus) => statusListeners.forEach((cb) => cb(s));

  const subscribe = {
    onPriceUpdate(cb: (u: PriceUpdate) => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    onAlertTriggered(cb: (p: AlertPayload) => void) {
      alertListeners.add(cb);
      return () => {
        alertListeners.delete(cb);
      };
    },
    onStatusChange(cb: (s: ConnectionStatus) => void) {
      statusListeners.add(cb);
      return () => {
        statusListeners.delete(cb);
      };
    },
  };

  if (USE_MOCK) {
    return {
      onPriceUpdate: (cb) => mockEngine.onPriceUpdate(cb),
      onAlertTriggered: (cb) => mockEngine.onAlertTriggered(cb),
      onStatusChange: subscribe.onStatusChange,
      connect: () => {
        mockEngine.start();
        emitStatus('connected');
      },
      disconnect: () => mockEngine.stop(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stompClient: any = null;
  let stopped = false;

  return {
    ...subscribe,
    async connect() {
      stopped = false;
      emitStatus('reconnecting');
      const { Client } = await import('@stomp/stompjs');
      const SockJS = (await import('sockjs-client')).default;
      if (stopped) return;
      stompClient = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          emitStatus('connected');
          stompClient.subscribe('/topic/prices', (msg: { body: string }) => {
            const update = toPriceUpdate(JSON.parse(msg.body) as ApiPriceTick);
            listeners.forEach((cb) => cb(update));
          });
          if (token) {
            stompClient.subscribe('/user/queue/alerts', (msg: { body: string }) => {
              const payload = toAlertPayload(JSON.parse(msg.body) as ApiAlertEvent);
              alertListeners.forEach((cb) => cb(payload));
            });
          }
        },
        onWebSocketClose: () => {
          if (!stopped) emitStatus('reconnecting');
        },
        onStompError: () => emitStatus('reconnecting'),
      });
      stompClient.activate();
    },
    disconnect() {
      stopped = true;
      if (stompClient) stompClient.deactivate();
      emitStatus('disconnected');
    },
  };
}
