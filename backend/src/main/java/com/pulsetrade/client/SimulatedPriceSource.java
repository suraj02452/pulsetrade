package com.pulsetrade.client;

import com.pulsetrade.config.AppProperties;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.kafka.PricePublisher;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Offline price source: random-walks realistic prices once a second. Useful when Binance is
 * unreachable or for demos. Enable with app.prices.source=simulated.
 */
@Component
@ConditionalOnProperty(name = "app.prices.source", havingValue = "simulated")
public class SimulatedPriceSource {

    private static final Map<String, Double> SEED_PRICES = Map.ofEntries(
            Map.entry("BTCUSDT", 64000.0), Map.entry("ETHUSDT", 3100.0), Map.entry("SOLUSDT", 150.0),
            Map.entry("BNBUSDT", 580.0), Map.entry("XRPUSDT", 0.55), Map.entry("ADAUSDT", 0.40),
            Map.entry("DOGEUSDT", 0.12), Map.entry("AVAXUSDT", 28.0), Map.entry("DOTUSDT", 4.5),
            Map.entry("LINKUSDT", 11.0), Map.entry("POLUSDT", 0.25), Map.entry("LTCUSDT", 70.0),
            Map.entry("TRXUSDT", 0.15), Map.entry("SHIBUSDT", 0.000017), Map.entry("ATOMUSDT", 4.8));

    private final AppProperties props;
    private final PricePublisher publisher;
    private final PriceFeedStatus status;
    private final Map<String, double[]> state = new ConcurrentHashMap<>(); // [open, current, high, low, volume]

    public SimulatedPriceSource(AppProperties props, PricePublisher publisher, PriceFeedStatus status) {
        this.props = props;
        this.publisher = publisher;
        this.status = status;
        status.setConnected(true);
    }

    @Scheduled(fixedRate = 1000, initialDelay = 2000)
    public void tick() {
        long now = System.currentTimeMillis();
        for (String symbol : props.prices().symbols()) {
            double[] s = state.computeIfAbsent(symbol, k -> {
                double seed = SEED_PRICES.getOrDefault(k, 10.0);
                return new double[] {seed, seed, seed, seed, 0};
            });
            s[1] = s[1] * (1 + ThreadLocalRandom.current().nextGaussian() * 0.0015);
            s[2] = Math.max(s[2], s[1]);
            s[3] = Math.min(s[3], s[1]);
            s[4] += s[1] * ThreadLocalRandom.current().nextDouble(5, 50); // pretend trades in USDT
            BigDecimal change = BigDecimal.valueOf((s[1] - s[0]) / s[0] * 100).setScale(2, RoundingMode.HALF_UP);
            publisher.publish(new PriceTick(symbol, round(s[1]), change, round(s[2]), round(s[3]),
                    BigDecimal.valueOf(s[4]).setScale(2, RoundingMode.HALF_UP), now));
        }
        status.setConnected(true);
    }

    private static BigDecimal round(double value) {
        return BigDecimal.valueOf(value).round(new java.math.MathContext(8));
    }
}
