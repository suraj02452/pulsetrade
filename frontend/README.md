# PulseTrade Frontend

React frontend for PulseTrade: live crypto prices, watchlist, price alerts and portfolio tracking, connected to the Spring Boot backend in [`../backend`](../backend) over REST and WebSockets.

## Run

```bash
cp .env.example .env     # points at http://localhost:8080
npm install
npm run dev              # http://localhost:5173
```

Start the backend first (see the [root README](../README.md)). To try the UI without a backend, set `VITE_USE_MOCK=true` in `.env` for simulated prices and in-memory data.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Spring Boot REST API |
| `VITE_WS_URL` | `http://localhost:8080/ws` | STOMP-over-SockJS endpoint |
| `VITE_USE_MOCK` | `false` | `true` = offline mock data |

## How it talks to the backend

- **`src/services/api.ts`** is the only file that knows the backend's JSON shapes. It maps them to the UI types (numeric IDs to strings, ISO dates to timestamps, and so on), so pages and components never change when the API does.
- **Live data:** one STOMP connection subscribes to `/topic/prices` (all users) and `/user/queue/alerts` (the signed-in user only). The LIVE badge reflects the real connection state, and the client reconnects automatically.
- **Sessions:** the JWT is kept in `localStorage`, so a refresh keeps you signed in. On startup the token is checked with `/api/users/me`, and any `401` logs the user out with a "Session expired" notice. Logout clears every store, so the next user on the same browser starts clean.

## Features

- Dashboard with live prices (green/red flash, rolling digits), sparklines, sorting, search, top gainers/losers
- Coin page with 1H / 24H / 7D candle charts and real 24h high, low and volume
- Watchlist with drag-to-reorder (saved once per drag)
- Price alerts (ABOVE / BELOW) with live toast notifications and re-arm
- Portfolio with live profit/loss and allocation chart
- Dark and light themes (CSS-variable palette, remembered per browser), responsive mobile layout

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, NumberFlow, React Router, @stomp/stompjs + SockJS, lucide-react, sonner.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```
