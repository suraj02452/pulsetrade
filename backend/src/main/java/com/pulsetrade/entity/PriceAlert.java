package com.pulsetrade.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "price_alerts")
public class PriceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_condition", nullable = false, length = 10)
    private AlertCondition condition;

    @Column(name = "target_price", nullable = false, precision = 30, scale = 10)
    private BigDecimal targetPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private AlertStatus status = AlertStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "triggered_at")
    private Instant triggeredAt;

    @Column(name = "triggered_price", precision = 30, scale = 10)
    private BigDecimal triggeredPrice;

    protected PriceAlert() {}

    public PriceAlert(Long userId, String symbol, AlertCondition condition, BigDecimal targetPrice) {
        this.userId = userId;
        this.symbol = symbol;
        this.condition = condition;
        this.targetPrice = targetPrice;
    }

    public void rearm() {
        this.status = AlertStatus.ACTIVE;
        this.triggeredAt = null;
        this.triggeredPrice = null;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getSymbol() { return symbol; }
    public AlertCondition getCondition() { return condition; }
    public BigDecimal getTargetPrice() { return targetPrice; }
    public AlertStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getTriggeredAt() { return triggeredAt; }
    public BigDecimal getTriggeredPrice() { return triggeredPrice; }
}
