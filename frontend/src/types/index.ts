export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Price {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
  history: number[];
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  /** 24h high/low/volume (USDT) from the exchange; absent in older messages. */
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  timestamp: number;
}

export type AlertCondition = 'ABOVE' | 'BELOW';
export type AlertStatus = 'ACTIVE' | 'TRIGGERED';

export interface Alert {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
  currentPrice?: number;
  message?: string;
}

export interface AlertPayload {
  alertId: string;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
  message: string;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  addedAt: number;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TimeRange = '1h' | '24h' | '7d';

export interface Notification {
  id: string;
  alertId: string;
  symbol: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export type ThemeMode = 'dark' | 'light';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
