package com.pulsetrade.service;

import com.pulsetrade.entity.AlertCondition;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class NotificationMessageTest {

    @Test
    void buildsReadableMessages() {
        assertThat(NotificationService.buildMessage("ETHUSDT", AlertCondition.BELOW, new BigDecimal("2500")))
                .isEqualTo("ETH dropped below $2,500");
        assertThat(NotificationService.buildMessage("BTCUSDT", AlertCondition.ABOVE, new BigDecimal("70000.5")))
                .isEqualTo("BTC rose above $70,000.5");
        assertThat(NotificationService.buildMessage("SHIBUSDT", AlertCondition.ABOVE, new BigDecimal("0.000021")))
                .isEqualTo("SHIB rose above $0.000021");
    }
}
