package com.pulsetrade.kafka;

import com.pulsetrade.config.KafkaTopicConfig;
import com.pulsetrade.event.PriceTick;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Pushes prices to browsers on /topic/prices. Ticks can arrive many times a second, so they are
 * collected and sent at most once per interval per symbol (throttling keeps the UI smooth).
 * The consumer group id is unique per instance so every instance sees every tick and can serve
 * its own WebSocket clients.
 */
@Component
public class PriceBroadcaster {

    public static final String PRICES_DESTINATION = "/topic/prices";

    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, PriceTick> pending = new ConcurrentHashMap<>();

    public PriceBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = KafkaTopicConfig.PRICE_UPDATES_TOPIC,
            groupId = "pulsetrade-broadcast-#{T(java.util.UUID).randomUUID().toString()}")
    public void onTick(PriceTick tick) {
        pending.put(tick.symbol(), tick); // newer ticks overwrite older ones within the window
    }

    @Scheduled(fixedRateString = "${app.prices.broadcast-interval-ms:1000}")
    public void flush() {
        for (String symbol : pending.keySet()) {
            PriceTick tick = pending.remove(symbol);
            if (tick != null) {
                messagingTemplate.convertAndSend(PRICES_DESTINATION, tick);
            }
        }
    }
}
