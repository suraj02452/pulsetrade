package com.pulsetrade.kafka;

import com.pulsetrade.cache.AlertIndex;
import com.pulsetrade.config.KafkaTopicConfig;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.service.AlertService;
import com.pulsetrade.service.NotificationService;

import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Checks every price tick against the alert index. Runs in a shared consumer group, so with
 * several instances each tick is evaluated once.
 */
@Component
public class AlertEngine {

    private static final Logger log = LoggerFactory.getLogger(AlertEngine.class);

    private final AlertIndex index;
    private final AlertService alertService;
    private final NotificationService notificationService;

    public AlertEngine(AlertIndex index, AlertService alertService, NotificationService notificationService) {
        this.index = index;
        this.alertService = alertService;
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = KafkaTopicConfig.PRICE_UPDATES_TOPIC, groupId = "pulsetrade-alerts")
    public void onTick(PriceTick tick) {
        Set<Long> candidates = index.findTriggered(tick.symbol(), tick.price());
        for (Long alertId : candidates) {
            alertService.tryTrigger(alertId, tick.symbol(), tick.price()).ifPresent(alert -> {
                log.info("Alert {} triggered: {} {} {} at {}", alert.getId(), alert.getSymbol(),
                        alert.getCondition(), alert.getTargetPrice(), tick.price());
                notificationService.alertTriggered(alert, tick.price());
            });
        }
    }
}
