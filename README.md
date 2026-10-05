# PulseTrade

**Real-time cryptocurrency tracker with live prices, price alerts and portfolio tracking.**
Spring Boot · Kafka · Redis · MySQL · WebSockets · React · TypeScript

Live prices stream from Binance through Kafka to the browser every second. Users build a watchlist, track their holdings' profit and loss, and get an instant notification when a coin crosses a price they set.

## Architecture

```
 Binance WebSocket ──► Spring Boot ──► Kafka "price-updates"
                                           │
          ┌────────────────────────────────┼──────────────────────────────┐
          ▼                                ▼                              ▼
   Price broadcaster               History + cache                  Alert engine
   (1 msg/sec/coin)                Redis latest prices              Redis sorted sets,
   STOMP /topic/prices             MySQL price history              exactly-once trigger
          │                                                               │
          ▼                                                               ▼
   React app  ◄─────────────────── /user/queue/alerts ◄──────── Notifications (MySQL)
```

| Folder | What it is |
|---|---|
| [`backend/`](backend) | Spring Boot 3 API: JWT auth, Kafka pipeline, alert engine, WebSocket broadcast. See its [README](backend/README.md) for the API and design decisions. |
| [`frontend/`](frontend) | React + TypeScript app. See its [README](frontend/README.md). |

## Highlights

- **Event-driven pipeline:** Kafka decouples price ingestion from consumers (broadcast, history, alerts), each in its own consumer group.
- **Fast alert matching:** alerts live in Redis sorted sets keyed by target price, so each tick is a range query instead of a scan over every alert.
- **Exactly-once notifications:** an atomic `UPDATE ... WHERE status = 'ACTIVE'` ensures an alert fires once, even when the price hovers around the target. Covered by an integration test.
- **Resilient feed:** exponential-backoff reconnects, plus a watchdog that replaces a silently dead ("half-open") Binance socket.
- **Tests:** unit tests plus Testcontainers integration tests against real MySQL, Kafka and Redis. CI runs on every push.

## Run it locally

**Prerequisites:** JDK 17+, Node 18+, Docker Desktop, MySQL 8 running on `localhost:3306`.

```bash
# 1. Redis + Kafka
cd backend
docker compose up -d

# 2. Backend (set your MySQL password first: DB_PASSWORD env var or application.yml)
mvn spring-boot:run          # http://localhost:8080  (Swagger UI: /swagger-ui.html)

# 3. Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

No MySQL installed? `docker compose --profile app up -d --build` in `backend/` runs MySQL and the backend in Docker too.

## Tech stack

| | |
|---|---|
| Backend | Java 17, Spring Boot 3.5, Spring Security + JWT, Spring WebSocket (STOMP), Spring Kafka, Spring Data JPA, Flyway |
| Data | MySQL 8, Redis 7, Apache Kafka 3.8 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion |
| Testing & DevOps | JUnit 5, Mockito, Testcontainers, Docker Compose, GitHub Actions |
