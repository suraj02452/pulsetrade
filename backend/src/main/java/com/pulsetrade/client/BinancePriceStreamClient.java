package com.pulsetrade.client;

import com.pulsetrade.config.AppProperties;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.kafka.PricePublisher;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Connects to Binance's free public WebSocket (no API key) and turns 24h mini-ticker events
 * into {@link PriceTick}s. Reconnects with exponential backoff when the connection drops.
 *
 * A watchdog also reconnects when no message has arrived for {@link #STALL_TIMEOUT}. Without it, a network blip
 * can leave a "half-open" socket that never reports a close, and prices silently stop updating.
 */
@Component
@ConditionalOnProperty(name = "app.prices.source", havingValue = "binance", matchIfMissing = true)
public class BinancePriceStreamClient {

    private static final Logger log = LoggerFactory.getLogger(BinancePriceStreamClient.class);
    private static final long MAX_BACKOFF_SECONDS = 60;
    /** Binance sends about one mini-ticker per second per symbol, so 30s of silence means the socket is dead. */
    static final Duration STALL_TIMEOUT = Duration.ofSeconds(30);

    private final AppProperties props;
    private final PricePublisher publisher;
    private final PriceFeedStatus status;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "binance-reconnect");
        t.setDaemon(true);
        return t;
    });

    private volatile WebSocket webSocket;
    private volatile boolean shuttingDown;
    private volatile long lastMessageAt;
    private final AtomicBoolean reconnectPending = new AtomicBoolean(false);
    private long backoffSeconds = 1;

    public BinancePriceStreamClient(AppProperties props, PricePublisher publisher,
                                    PriceFeedStatus status, ObjectMapper objectMapper) {
        this.props = props;
        this.publisher = publisher;
        this.status = status;
        this.objectMapper = objectMapper;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        connect();
        scheduler.scheduleAtFixedRate(this::checkForStall, 10, 10, TimeUnit.SECONDS);
    }

    /** Aborts and replaces the connection if Binance has gone quiet. Returns true if it did. */
    boolean checkForStall() {
        WebSocket current = webSocket;
        if (current == null || reconnectPending.get()) {
            return false;
        }
        long silentMs = System.currentTimeMillis() - lastMessageAt;
        if (silentMs < STALL_TIMEOUT.toMillis()) {
            return false;
        }
        log.warn("No Binance messages for {}s, reconnecting", silentMs / 1000);
        webSocket = null;
        current.abort();
        scheduleReconnect();
        return true;
    }

    private void connect() {
        if (shuttingDown) {
            return;
        }
        reconnectPending.set(false); // this attempt is the pending reconnect; a failure may schedule the next one
        String streams = props.prices().symbols().stream()
                .map(s -> s.toLowerCase(Locale.ROOT) + "@miniTicker")
                .collect(Collectors.joining("/"));
        URI uri = URI.create(props.prices().binanceUrl() + "?streams=" + streams);
        log.info("Connecting to Binance stream for {} symbols", props.prices().symbols().size());
        httpClient.newWebSocketBuilder()
                .buildAsync(uri, new Listener())
                .whenComplete((ws, error) -> {
                    if (error != null) {
                        log.warn("Binance connection failed: {}", error.getMessage());
                        scheduleReconnect();
                    } else {
                        webSocket = ws;
                        lastMessageAt = System.currentTimeMillis();
                        backoffSeconds = 1;
                        status.setConnected(true);
                        log.info("Connected to Binance price stream");
                    }
                });
    }

    private synchronized void scheduleReconnect() {
        status.setConnected(false);
        // Only one reconnect at a time: abort(), onClose and onError can all fire for the same failure.
        if (shuttingDown || !reconnectPending.compareAndSet(false, true)) {
            return;
        }
        long delay = backoffSeconds;
        backoffSeconds = Math.min(backoffSeconds * 2, MAX_BACKOFF_SECONDS);
        log.info("Reconnecting to Binance in {}s", delay);
        scheduler.schedule(this::connect, delay, TimeUnit.SECONDS);
    }

    void handleMessage(String json) {
        try {
            JsonNode data = objectMapper.readTree(json).path("data");
            if (data.isMissingNode() || !data.has("s")) {
                return;
            }
            BigDecimal close = new BigDecimal(data.get("c").asText());
            BigDecimal open = new BigDecimal(data.get("o").asText());
            BigDecimal change = open.signum() == 0 ? BigDecimal.ZERO
                    : close.subtract(open).multiply(BigDecimal.valueOf(100)).divide(open, 2, RoundingMode.HALF_UP);
            publisher.publish(new PriceTick(data.get("s").asText(), close.stripTrailingZeros(), change,
                    decimal(data, "h"), decimal(data, "l"), decimal(data, "q"),
                    data.path("E").asLong(System.currentTimeMillis())));
        } catch (Exception e) {
            log.debug("Skipping unreadable Binance message: {}", e.getMessage());
        }
    }

    /** Reads a numeric string field such as "65010.00000000", or null if Binance didn't send it. */
    private static BigDecimal decimal(JsonNode data, String field) {
        JsonNode node = data.get(field);
        return node == null || node.isNull() ? null : new BigDecimal(node.asText()).stripTrailingZeros();
    }

    @PreDestroy
    public void stop() {
        shuttingDown = true;
        scheduler.shutdownNow();
        if (webSocket != null) {
            webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "shutdown");
        }
    }

    private class Listener implements WebSocket.Listener {

        private final StringBuilder buffer = new StringBuilder();

        @Override
        public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
            lastMessageAt = System.currentTimeMillis();
            buffer.append(data);
            if (last) {
                handleMessage(buffer.toString());
                buffer.setLength(0);
            }
            ws.request(1);
            return null;
        }

        @Override
        public CompletionStage<?> onClose(WebSocket ws, int statusCode, String reason) {
            if (isStale(ws)) {
                return null;
            }
            log.warn("Binance stream closed ({}): {}", statusCode, reason);
            scheduleReconnect();
            return null;
        }

        @Override
        public void onError(WebSocket ws, Throwable error) {
            if (isStale(ws)) {
                return;
            }
            log.warn("Binance stream error: {}", error.getMessage());
            scheduleReconnect();
        }

        /** Ignores late events from a socket that has already been replaced. */
        private boolean isStale(WebSocket ws) {
            WebSocket current = webSocket;
            return current != null && current != ws;
        }
    }
}
