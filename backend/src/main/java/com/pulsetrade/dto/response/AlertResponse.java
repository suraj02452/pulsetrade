package com.pulsetrade.dto.response;

import com.pulsetrade.entity.AlertCondition;
import com.pulsetrade.entity.AlertStatus;
import com.pulsetrade.entity.PriceAlert;

import java.math.BigDecimal;
import java.time.Instant;

public record AlertResponse(Long id, String symbol, AlertCondition condition, BigDecimal targetPrice,
                            AlertStatus status, Instant createdAt, Instant triggeredAt, BigDecimal triggeredPrice) {

    public static AlertResponse from(PriceAlert a) {
        return new AlertResponse(a.getId(), a.getSymbol(), a.getCondition(), a.getTargetPrice().stripTrailingZeros(),
                a.getStatus(), a.getCreatedAt(), a.getTriggeredAt(),
                a.getTriggeredPrice() == null ? null : a.getTriggeredPrice().stripTrailingZeros());
    }
}
