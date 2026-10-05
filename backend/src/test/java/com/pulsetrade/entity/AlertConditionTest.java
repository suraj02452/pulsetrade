package com.pulsetrade.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AlertConditionTest {

    private static final BigDecimal TARGET = new BigDecimal("60000");

    @Test
    void aboveFiresAtOrAboveTarget() {
        assertThat(AlertCondition.ABOVE.isMet(TARGET, new BigDecimal("60000"))).isTrue();
        assertThat(AlertCondition.ABOVE.isMet(TARGET, new BigDecimal("60000.01"))).isTrue();
        assertThat(AlertCondition.ABOVE.isMet(TARGET, new BigDecimal("59999.99"))).isFalse();
    }

    @Test
    void belowFiresAtOrBelowTarget() {
        assertThat(AlertCondition.BELOW.isMet(TARGET, new BigDecimal("60000"))).isTrue();
        assertThat(AlertCondition.BELOW.isMet(TARGET, new BigDecimal("59999.99"))).isTrue();
        assertThat(AlertCondition.BELOW.isMet(TARGET, new BigDecimal("60000.01"))).isFalse();
    }
}
