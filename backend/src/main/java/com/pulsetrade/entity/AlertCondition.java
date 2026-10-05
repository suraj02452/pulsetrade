package com.pulsetrade.entity;

import java.math.BigDecimal;

public enum AlertCondition {
    ABOVE,
    BELOW;

    /** ABOVE fires once price is at or above the target; BELOW once it is at or below. */
    public boolean isMet(BigDecimal targetPrice, BigDecimal currentPrice) {
        int cmp = currentPrice.compareTo(targetPrice);
        return this == ABOVE ? cmp >= 0 : cmp <= 0;
    }
}
