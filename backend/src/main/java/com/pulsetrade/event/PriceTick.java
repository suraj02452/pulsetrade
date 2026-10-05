package com.pulsetrade.event;

import java.math.BigDecimal;

/**
 * One price update. This exact shape travels through Kafka and is pushed to browsers on /topic/prices:
 * { "symbol": "BTCUSDT", "price": 64231.55, "change24h": 2.31, "high24h": 65010.00, "low24h": 62500.10,
 *   "volume24h": 1834567890.12, "timestamp": 1727680000000 }
 * volume24h is the 24h traded volume in USDT.
 */
public record PriceTick(String symbol, BigDecimal price, BigDecimal change24h,
                        BigDecimal high24h, BigDecimal low24h, BigDecimal volume24h, long timestamp) {}
