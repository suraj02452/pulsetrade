package com.pulsetrade.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String PRICE_UPDATES_TOPIC = "price-updates";

    @Bean
    public NewTopic priceUpdatesTopic() {
        // Keyed by symbol, so every tick for one symbol stays ordered on one partition.
        return TopicBuilder.name(PRICE_UPDATES_TOPIC).partitions(3).replicas(1).build();
    }
}
