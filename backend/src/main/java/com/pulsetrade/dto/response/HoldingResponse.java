package com.pulsetrade.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

/** Live values are null until the first price tick for the symbol has arrived. */
public record HoldingResponse(Long id, String symbol, BigDecimal quantity, BigDecimal buyPrice, Instant createdAt,
                              BigDecimal currentPrice, BigDecimal invested, BigDecimal currentValue,
                              BigDecimal profitLoss, BigDecimal profitLossPercent) {}
