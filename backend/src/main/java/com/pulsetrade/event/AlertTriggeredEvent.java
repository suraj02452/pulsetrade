package com.pulsetrade.event;

import com.pulsetrade.entity.AlertCondition;

import java.math.BigDecimal;

/**
 * Pushed to /user/queue/alerts. Matches the frontend contract:
 * { alertId, symbol, condition, targetPrice, currentPrice, message }.
 */
public record AlertTriggeredEvent(Long alertId, String symbol, AlertCondition condition,
                                  BigDecimal targetPrice, BigDecimal currentPrice, String message,
                                  Long notificationId, long timestamp) {}
