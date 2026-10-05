package com.pulsetrade.kafka;

import com.pulsetrade.client.PriceFeedStatus;
import com.pulsetrade.config.KafkaTopicConfig;
import com.pulsetrade.event.PriceTick;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/** Every price source hands ticks to this class, which puts them on Kafka keyed by symbol. */
@Component
public class PricePublisher {

    private static final Logger log = LoggerFactory.getLogger(PricePublisher.class);

    private final KafkaTemplate<String, PriceTick> kafkaTemplate;
    private final PriceFeedStatus status;

    public PricePublisher(KafkaTemplate<String, PriceTick> kafkaTemplate, PriceFeedStatus status) {
        this.kafkaTemplate = kafkaTemplate;
        this.status = status;
    }

    public void publish(PriceTick tick) {
        status.markTick(tick.timestamp());
        kafkaTemplate.send(KafkaTopicConfig.PRICE_UPDATES_TOPIC, tick.symbol(), tick)
                .whenComplete((result, error) -> {
                    if (error != null) {
                        log.warn("Failed to publish tick for {}: {}", tick.symbol(), error.getMessage());
                    }
                });
    }
}
