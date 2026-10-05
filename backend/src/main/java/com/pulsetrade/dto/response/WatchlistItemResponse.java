package com.pulsetrade.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

/** price and change24h come from the live cache and may be null before the first tick. */
public record WatchlistItemResponse(Long id, String symbol, int position, Instant addedAt,
                                    BigDecimal price, BigDecimal change24h) {}
