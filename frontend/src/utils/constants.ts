// The 15 coins the backend streams from Binance (keep in sync with app.prices.symbols in application.yml).
// basePrice is only used by the offline mock engine.
export const COINS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', basePrice: 84700 },
  { symbol: 'ETHUSDT', name: 'Ethereum', basePrice: 2680 },
  { symbol: 'SOLUSDT', name: 'Solana', basePrice: 119.4 },
  { symbol: 'BNBUSDT', name: 'BNB', basePrice: 768.5 },
  { symbol: 'XRPUSDT', name: 'XRP', basePrice: 1.489 },
  { symbol: 'ADAUSDT', name: 'Cardano', basePrice: 0.2468 },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', basePrice: 0.09324 },
  { symbol: 'AVAXUSDT', name: 'Avalanche', basePrice: 10.89 },
  { symbol: 'DOTUSDT', name: 'Polkadot', basePrice: 1.153 },
  { symbol: 'LINKUSDT', name: 'Chainlink', basePrice: 13.93 },
  { symbol: 'LTCUSDT', name: 'Litecoin', basePrice: 68.95 },
  { symbol: 'TRXUSDT', name: 'TRON', basePrice: 0.3342 },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', basePrice: 0.00000573 },
  { symbol: 'ATOMUSDT', name: 'Cosmos', basePrice: 1.673 },
  { symbol: 'POLUSDT', name: 'Polygon', basePrice: 0.25 },
] as const;

const COIN_NAMES: Record<string, string> = Object.fromEntries(COINS.map((c) => [c.symbol, c.name]));

/** "BTCUSDT" -> "Bitcoin"; falls back to the base asset ("XYZ") for coins not in the list. */
export function coinName(symbol: string): string {
  return COIN_NAMES[symbol] ?? symbol.replace(/USDT$/, '');
}

export const CURRENCY_USD = 'USD';
export const LOCALE_US = 'en-US';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const WS_URL = import.meta.env.VITE_WS_URL || `${API_URL}/ws`;

// Mock mode only when explicitly enabled with VITE_USE_MOCK=true. Default is the real Spring Boot backend.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
