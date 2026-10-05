package com.pulsetrade;

import com.pulsetrade.config.AppProperties;

import java.util.List;

public final class TestProps {

    private TestProps() {}

    public static AppProperties appProperties() {
        return new AppProperties(
                new AppProperties.Jwt("test-secret-test-secret-test-secret-0123456789", 60),
                new AppProperties.Cors(List.of("http://localhost:5173")),
                new AppProperties.Prices("none", List.of("BTCUSDT", "ETHUSDT"),
                        "wss://example.invalid/stream", 1000, 30, 8),
                new AppProperties.Notifications(false, "test@pulsetrade.dev"));
    }
}
