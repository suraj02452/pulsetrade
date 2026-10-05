package com.pulsetrade.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed view of the {@code app.*} settings in application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Prices prices, Notifications notifications) {

    public record Jwt(String secret, long expirationMinutes) {}

    public record Cors(List<String> allowedOrigins) {}

    /**
     * @param source              where live prices come from: binance, simulated or none
     * @param symbols             symbols to track, e.g. BTCUSDT
     * @param binanceUrl          Binance combined-stream base URL
     * @param broadcastIntervalMs how often throttled prices are pushed to browsers
     * @param historySampleSeconds how often a price snapshot is stored for charts
     * @param historyRetentionDays how long price history is kept
     */
    public record Prices(
            String source,
            List<String> symbols,
            String binanceUrl,
            long broadcastIntervalMs,
            long historySampleSeconds,
            int historyRetentionDays) {}

    public record Notifications(boolean emailEnabled, String fromAddress) {}
}
