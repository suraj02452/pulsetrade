package com.pulsetrade.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "price_history")
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false, precision = 30, scale = 10)
    private BigDecimal price;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    protected PriceHistory() {}

    public PriceHistory(String symbol, BigDecimal price, Instant recordedAt) {
        this.symbol = symbol;
        this.price = price;
        this.recordedAt = recordedAt;
    }

    public Long getId() { return id; }
    public String getSymbol() { return symbol; }
    public BigDecimal getPrice() { return price; }
    public Instant getRecordedAt() { return recordedAt; }
}
