package com.pulsetrade.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "watchlist_items")
public class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false)
    private int position;

    @Column(name = "added_at", nullable = false)
    private Instant addedAt = Instant.now();

    protected WatchlistItem() {}

    public WatchlistItem(Long userId, String symbol, int position) {
        this.userId = userId;
        this.symbol = symbol;
        this.position = position;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getSymbol() { return symbol; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public Instant getAddedAt() { return addedAt; }
}
