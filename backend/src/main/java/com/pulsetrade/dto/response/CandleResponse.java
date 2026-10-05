package com.pulsetrade.dto.response;

import java.math.BigDecimal;

/** One OHLC candle for the price chart. time is the candle's start, in epoch milliseconds. */
public record CandleResponse(long time, BigDecimal open, BigDecimal high, BigDecimal low, BigDecimal close) {}
