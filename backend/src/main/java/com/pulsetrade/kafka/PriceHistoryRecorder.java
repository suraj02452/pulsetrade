package com.pulsetrade.kafka;

import com.pulsetrade.config.AppProperties;
import com.pulsetrade.config.KafkaTopicConfig;
import com.pulsetrade.entity.PriceHistory;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.repository.PriceHistoryRepository;
import com.pulsetrade.service.PriceCacheService;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Keeps the Redis "latest price" cache up to date and stores a sampled snapshot per symbol
 * for charts. Sampling (instead of saving every tick) keeps the history table small.
 * A shared consumer group means each tick is handled by exactly one instance.
 */
@Component
public class PriceHistoryRecorder {

    private static final Logger log = LoggerFactory.getLogger(PriceHistoryRecorder.class);

    private final PriceCacheService cache;
    private final PriceHistoryRepository repository;
    private final AppProperties props;
    private final Map<String, PriceTick> latest = new ConcurrentHashMap<>();

    public PriceHistoryRecorder(PriceCacheService cache, PriceHistoryRepository repository, AppProperties props) {
        this.cache = cache;
        this.repository = repository;
        this.props = props;
    }

    @KafkaListener(topics = KafkaTopicConfig.PRICE_UPDATES_TOPIC, groupId = "pulsetrade-state")
    public void onTick(PriceTick tick) {
        cache.save(tick);
        latest.put(tick.symbol(), tick);
    }

    @Scheduled(fixedRateString = "#{${app.prices.history-sample-seconds:30} * 1000}", initialDelay = 10_000)
    public void sample() {
        if (latest.isEmpty()) {
            return;
        }
        Instant now = Instant.now();
        List<PriceHistory> rows = new ArrayList<>();
        latest.values().forEach(t -> rows.add(new PriceHistory(t.symbol(), t.price(), now)));
        repository.saveAll(rows);
    }

    @Scheduled(cron = "0 15 3 * * *")
    public void purgeOldHistory() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(props.prices().historyRetentionDays()));
        int deleted = repository.deleteOlderThan(cutoff);
        log.info("Purged {} price history rows older than {}", deleted, cutoff);
    }
}
