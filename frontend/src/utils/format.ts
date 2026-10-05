import { LOCALE_US, CURRENCY_USD } from './constants';

export function formatPrice(price: number, symbol?: string): string {
  // Tiny prices (e.g. SHIB at 0.0000057) need more digits to show any movement.
  const abs = Math.abs(price);
  const fractionDigits = abs >= 1000 || abs === 0 ? 2 : abs >= 1 ? 4 : abs >= 0.01 ? 6 : 8;
  return new Intl.NumberFormat(LOCALE_US, {
    style: 'currency',
    currency: CURRENCY_USD,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(price);
}

/** Dollar amounts such as portfolio value or profit/loss: always 2 decimals, e.g. $848.08. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(LOCALE_US, {
    style: 'currency',
    currency: CURRENCY_USD,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat(LOCALE_US, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(LOCALE_US, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(LOCALE_US, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(LOCALE_US, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCoinName(symbol: string): string {
  return symbol.replace('USDT', '');
}
