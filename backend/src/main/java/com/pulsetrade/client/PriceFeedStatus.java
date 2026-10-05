package com.pulsetrade.client;

import com.pulsetrade.config.AppProperties;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/** Tracks whether the upstream price feed is healthy, so the UI can show a "data delayed" badge. */
@Component
public class PriceFeedStatus {

    private static final long STALE_AFTER_MS = 10_000;

    private final String source;
    private final AtomicBoolean connected = new AtomicBoolean(false);
    private final AtomicLong lastTickAt = new AtomicLong(0);

    public PriceFeedStatus(AppProperties props) {
        this.source = props.prices().source();
    }

    public void setConnected(boolean value) {
        connected.set(value);
    }

    public void markTick(long timestamp) {
        lastTickAt.set(timestamp);
    }

    public Snapshot snapshot() {
        long last = lastTickAt.get();
        boolean stale = last == 0 || System.currentTimeMillis() - last > STALE_AFTER_MS;
        return new Snapshot(source, connected.get(), stale, last == 0 ? null : Instant.ofEpochMilli(last));
    }

    public record Snapshot(String source, boolean connected, boolean stale, Instant lastTickAt) {}
}
