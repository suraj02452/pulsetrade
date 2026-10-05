-- MySQL 8 schema. Timestamps are stored in UTC (hibernate.jdbc.time_zone=UTC).

CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100),
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE watchlist_items (
    id       BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id  BIGINT      NOT NULL,
    symbol   VARCHAR(20) NOT NULL,
    position INT         NOT NULL DEFAULT 0,
    added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_watchlist_user_symbol UNIQUE (user_id, symbol),
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE price_alerts (
    id              BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    symbol          VARCHAR(20)     NOT NULL,
    alert_condition VARCHAR(10)     NOT NULL,
    target_price    DECIMAL(30, 10) NOT NULL,
    status          VARCHAR(15)     NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    triggered_at    DATETIME(6),
    triggered_price DECIMAL(30, 10),
    CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_alert_condition CHECK (alert_condition IN ('ABOVE', 'BELOW')),
    CONSTRAINT chk_alert_status CHECK (status IN ('ACTIVE', 'TRIGGERED')),
    CONSTRAINT chk_alert_target CHECK (target_price > 0)
);
CREATE INDEX idx_price_alerts_user ON price_alerts (user_id, created_at);
CREATE INDEX idx_price_alerts_status ON price_alerts (status);

CREATE TABLE holdings (
    id         BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT          NOT NULL,
    symbol     VARCHAR(20)     NOT NULL,
    quantity   DECIMAL(30, 10) NOT NULL,
    buy_price  DECIMAL(30, 10) NOT NULL,
    created_at DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_holdings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_holding_quantity CHECK (quantity > 0),
    CONSTRAINT chk_holding_price CHECK (buy_price > 0)
);

CREATE TABLE notifications (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    alert_id   BIGINT,
    message    VARCHAR(500) NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX idx_notifications_user ON notifications (user_id, created_at);

CREATE TABLE price_history (
    id          BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    symbol      VARCHAR(20)     NOT NULL,
    price       DECIMAL(30, 10) NOT NULL,
    recorded_at DATETIME(6)     NOT NULL
);
CREATE INDEX idx_price_history_symbol_time ON price_history (symbol, recorded_at);
