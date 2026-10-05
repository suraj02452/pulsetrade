package com.pulsetrade.util;

import java.util.Locale;

public final class Symbols {

    private Symbols() {}

    /** Normalises user input like "btcusdt" or " BTCUSDT " to "BTCUSDT". */
    public static String normalize(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new IllegalArgumentException("Symbol is required");
        }
        return symbol.trim().toUpperCase(Locale.ROOT);
    }

    /** "BTCUSDT" becomes "BTC", for human-readable messages. */
    public static String baseAsset(String symbol) {
        return symbol.endsWith("USDT") ? symbol.substring(0, symbol.length() - 4) : symbol;
    }
}
