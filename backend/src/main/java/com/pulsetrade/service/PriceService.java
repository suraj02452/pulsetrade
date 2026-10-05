package com.pulsetrade.service;

import com.pulsetrade.dto.response.CandleResponse;
import com.pulsetrade.dto.response.PricePointResponse;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.exception.NotFoundException;
import com.pulsetrade.repository.PriceHistoryRepository;
import com.pulsetrade.util.Symbols;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class PriceService {

    private final PriceCacheService cache;
    private final PriceHistoryRepository historyRepository;

    public PriceService(PriceCacheService cache, PriceHistoryRepository historyRepository) {
        this.cache = cache;
        this.historyRepository = historyRepository;
    }

    public List<PriceTick> latestPrices() {
        return cache.findAll();
    }

    public PriceTick latestPrice(String symbol) {
        String normalized = Symbols.normalize(symbol);
        return cache.find(normalized).orElseThrow(() -> new NotFoundException("No price yet for " + normalized));
    }

    /** OHLC candles for the chart: 1h = 2-minute candles, 24h = 30-minute, 7d = 2-hour. */
    public List<CandleResponse> history(String symbol, String range) {
        ChartRange chartRange = ChartRange.parse(range);
        Instant since = Instant.now().minus(chartRange.span());
        List<PricePointResponse> points = historyRepository
                .findBySymbolAndRecordedAtAfterOrderByRecordedAtAsc(Symbols.normalize(symbol), since)
                .stream()
                .map(h -> new PricePointResponse(h.getRecordedAt().toEpochMilli(), h.getPrice()))
                .toList();
        return toCandles(points, chartRange.candle().toMillis());
    }

    /**
     * Groups time-ordered price samples into fixed-size candles. Each candle opens with the first sample in its
     * window and closes with the last; empty windows are skipped.
     */
    static List<CandleResponse> toCandles(List<PricePointResponse> points, long bucketMillis) {
        List<CandleResponse> candles = new ArrayList<>();
        long bucketStart = Long.MIN_VALUE;
        BigDecimal open = null, high = null, low = null, close = null;
        for (PricePointResponse p : points) {
            long start = Math.floorDiv(p.timestamp(), bucketMillis) * bucketMillis;
            if (start != bucketStart) {
                if (open != null) {
                    candles.add(candle(bucketStart, open, high, low, close));
                }
                bucketStart = start;
                open = high = low = close = p.price();
            } else {
                high = high.max(p.price());
                low = low.min(p.price());
                close = p.price();
            }
        }
        if (open != null) {
            candles.add(candle(bucketStart, open, high, low, close));
        }
        return candles;
    }

    private static CandleResponse candle(long time, BigDecimal o, BigDecimal h, BigDecimal l, BigDecimal c) {
        return new CandleResponse(time, o.stripTrailingZeros(), h.stripTrailingZeros(),
                l.stripTrailingZeros(), c.stripTrailingZeros());
    }

    record ChartRange(Duration span, Duration candle) {
        static ChartRange parse(String range) {
            return switch (range == null ? "24h" : range.toLowerCase(Locale.ROOT)) {
                case "1h" -> new ChartRange(Duration.ofHours(1), Duration.ofMinutes(2));
                case "24h", "1d" -> new ChartRange(Duration.ofHours(24), Duration.ofMinutes(30));
                case "7d" -> new ChartRange(Duration.ofDays(7), Duration.ofHours(2));
                default -> throw new IllegalArgumentException("range must be one of 1h, 24h, 7d");
            };
        }
    }
}
