# PulseTrade Backend

Real-time cryptocurrency price tracker built with **Spring Boot 3, Kafka, Redis, MySQL and WebSockets**.
Live prices stream from Binance through Kafka to the browser, and an alert engine notifies users the moment a price crosses their target.

This is the backend for the PulseTrade React frontend.

## Architecture

```
Binance WebSocket (or simulator)
          │  24h mini-ticker events
          ▼
  BinancePriceStreamClient ──► PricePublisher ──► Kafka topic "price-updates" (key = symbol)
                                                        │
              ┌─────────────────────────────────────────┼─────────────────────────────┐
              ▼                                         ▼                             ▼
     PriceBroadcaster                         PriceHistoryRecorder              AlertEngine
     group: unique per instance               group: pulsetrade-state           group: pulsetrade-alerts
     throttles to 1 msg/sec/symbol            Redis latest-price cache          Redis sorted-set lookup
     STOMP /topic/prices                      sampled history → MySQL           exactly-once trigger
              │                                                                       │
              ▼                                                                       ▼
        React frontend  ◄──────────── /user/queue/alerts ◄──────────── NotificationService
                                                                        (DB + WebSocket + email)
```

Kafka decouples ingestion from consumers: a new consumer (say, a trading-volume analyser) can be added without touching existing code.

## Tech stack

| Layer | Technology |
|---|---|
| Language / framework | Java 17, Spring Boot 3.5 |
| API | Spring Web (REST), springdoc OpenAPI (Swagger UI) |
| Real-time | Spring WebSocket, STOMP over SockJS |
| Security | Spring Security, JWT (jjwt), BCrypt |
| Messaging | Apache Kafka (Spring Kafka, JSON serialisation) |
| Cache / index | Redis (latest prices hash, alert sorted sets) |
| Database | MySQL 8, Spring Data JPA, Flyway migrations |
| Observability | Spring Actuator, Micrometer Prometheus |
| Testing | JUnit 5, Mockito, AssertJ, Testcontainers |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Run locally

**Prerequisites:** JDK 17+, MySQL 8 running locally, Docker Desktop (for Redis and Kafka), IntelliJ IDEA (or Maven 3.9+).

1. Set your MySQL password in `src/main/resources/application.yml` (`spring.datasource.password`), or set the `DB_PASSWORD` environment variable. The `pulsetrade` database is created automatically.
2. Start Redis and Kafka:
   ```bash
   docker compose up -d
   ```
3. Run the app: open `PulseTradeApplication` in IntelliJ and click **Run**, or
   ```bash
   mvn spring-boot:run
   ```
4. Open Swagger UI at http://localhost:8080/swagger-ui.html

Flyway creates the tables on first start. Live prices begin within a few seconds.

**No internet access to Binance?** Set the environment variable `PRICE_SOURCE=simulated` and the app generates realistic random-walk prices instead.

**Everything in Docker (including MySQL):** `docker compose --profile app up -d --build`

## Connect the React frontend

In the frontend's `.env`:

```
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
```

The frontend's origin must be listed in `CORS_ALLOWED_ORIGINS` (localhost:5173 and localhost:3000 are allowed by default).

## API

All endpoints except auth, public prices, WebSocket, health and docs need `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` → `{token, user}` |
| POST | `/api/auth/login` | `{email, password}` → `{token, user}` |
| GET | `/api/users/me` | Current user |
| GET | `/api/prices` | Latest price for every symbol (from Redis) |
| GET | `/api/prices/{symbol}` | Latest price for one symbol |
| GET | `/api/prices/{symbol}/history?range=1h\|24h\|7d` | OHLC candles: `{time, open, high, low, close}` (2-min, 30-min or 2-hour candles) |
| GET | `/api/prices/status` | Feed health: source, connected, stale, last tick |
| GET | `/api/watchlist` | Watchlist with live prices |
| POST | `/api/watchlist` | `{symbol}` (idempotent) |
| PUT | `/api/watchlist/order` | `{symbols: [...]}` saves drag-and-drop order |
| DELETE | `/api/watchlist/{symbol}` | Remove a symbol |
| GET | `/api/alerts` | User's alerts |
| POST | `/api/alerts` | `{symbol, condition: ABOVE\|BELOW, targetPrice}` |
| PATCH | `/api/alerts/{id}/rearm` | Re-activate a triggered alert |
| DELETE | `/api/alerts/{id}` | Delete an alert |
| GET | `/api/portfolio` | Holdings with live value and P&L |
| GET | `/api/portfolio/summary` | Totals: invested, value, P&L |
| POST | `/api/portfolio` | `{symbol, quantity, buyPrice}` |
| DELETE | `/api/portfolio/{id}` | Remove a holding |
| GET | `/api/notifications` | Recent notifications |
| GET | `/api/notifications/unread-count` | Badge count |
| POST | `/api/notifications/{id}/read` | Mark one as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### WebSocket (STOMP over SockJS at `/ws`)

Send the JWT in the CONNECT frame: `Authorization: Bearer <token>` (optional for the public price feed).

| Subscribe to | Payload |
|---|---|
| `/topic/prices` | `{symbol, price, change24h, high24h, low24h, volume24h, timestamp}`, at most once per second per symbol |
| `/user/queue/alerts` | `{alertId, symbol, condition, targetPrice, currentPrice, message, notificationId, timestamp}` |

## Design decisions (interview talking points)

**1. Throttling the firehose.** Binance can send several updates per second per symbol. `PriceBroadcaster` keeps only the newest tick per symbol and flushes once a second, so the browser gets a steady stream instead of a flood.

**2. Checking thousands of alerts per tick.** Looping over every alert on every tick is O(n). Alerts are stored in two Redis sorted sets per symbol, scored by target price (`alerts:BTCUSDT:ABOVE`, `alerts:BTCUSDT:BELOW`). A tick becomes a range query: O(log n + matches).

**3. Exactly-once notifications.** When price hovers around a target, many ticks match the same alert. `markTriggered` runs `UPDATE ... SET status = 'TRIGGERED' WHERE id = ? AND status = 'ACTIVE'`; only the call that changes the row (count = 1) sends a notification. This holds even across multiple instances. `ApiIntegrationTest.alertFiresExactlyOnce` proves it.

**4. MySQL is the source of truth.** The Redis alert index is rebuilt from MySQL on startup, and Redis is only updated after the database transaction commits, so the engine never acts on uncommitted data.

**5. Consumer groups by purpose.** The alert engine and history recorder share a group (each tick handled once across instances). The broadcaster uses a unique group per instance (every instance needs every tick to serve its own WebSocket clients).

**6. Resilient ingestion.** The Binance client reconnects with exponential backoff (1s → 60s) and `/api/prices/status` reports when data is stale, so the UI can show a "data delayed" badge.

**7. Money is BigDecimal.** Prices and quantities use `BigDecimal` and `DECIMAL(30,10)`, never `double`, except as Redis sort scores.

### Scaling further

- Replace the in-memory STOMP broker with `enableStompBrokerRelay` (RabbitMQ) so `/user/queue/alerts` reaches users connected to any instance.
- Move price history to TimescaleDB hypertables for long ranges.

## Tests

```bash
mvn test
```

- Unit tests: JWT, alert conditions, Binance message parsing, chart downsampling, notification messages.
- `ApiIntegrationTest` starts real MySQL, Kafka and Redis with Testcontainers (needs Docker running; skipped otherwise) and covers register/login, the watchlist, and exactly-once alert triggering.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | `localhost:3306/pulsetrade`, `root`, `root` | MySQL |
| `REDIS_HOST`, `REDIS_PORT` | `localhost`, `6379` | Redis |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka |
| `JWT_SECRET` | dev-only value | **Set a long random value in production** |
| `PRICE_SOURCE` | `binance` | `binance`, `simulated` or `none` |
| `PRICE_SYMBOLS` | 15 major USDT pairs | Comma-separated symbols |
| `CORS_ALLOWED_ORIGINS` | localhost + common hosts | Allowed frontend origins (patterns OK) |
| `NOTIFICATIONS_EMAIL_ENABLED` | `false` | Turn on alert emails (also set `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`) |

## Project structure

Classic layered architecture: controller → service → repository → database.

```
src/main/java/com/pulsetrade
├── controller/     REST endpoints (Auth, Price, Watchlist, Alert, Portfolio, Notification)
├── service/        business logic (AuthService, AlertService, PortfolioService, PriceCacheService ...)
├── repository/     Spring Data JPA repositories
├── entity/         JPA entities and enums (User, PriceAlert, Holding, WatchlistItem ...)
├── dto/
│   ├── request/    validated request bodies (RegisterRequest, CreateAlertRequest ...)
│   └── response/   API responses (AuthResponse, AlertResponse, HoldingResponse ...)
├── event/          messages on Kafka and WebSocket (PriceTick, AlertTriggeredEvent)
├── kafka/          producer (PricePublisher) and consumers (PriceBroadcaster, PriceHistoryRecorder, AlertEngine)
├── client/         external price feeds (BinancePriceStreamClient, SimulatedPriceSource)
├── cache/          Redis alert index (sorted sets)
├── security/       JWT service, HTTP filter, STOMP auth interceptor
├── config/         security, WebSocket, Kafka topic, OpenAPI, app properties
├── exception/      global exception handler and custom exceptions
└── util/           small helpers
```
