package com.pulsetrade.dto.response;

import java.math.BigDecimal;

/** One stored price sample; samples are grouped into {@link CandleResponse}s for charts. */
public record PricePointResponse(long timestamp, BigDecimal price) {}
