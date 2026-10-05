package com.pulsetrade.cache;

import com.pulsetrade.entity.PriceAlert;

import java.math.BigDecimal;
import java.util.Set;

/** Fast lookup of which alerts a new price crosses, without scanning every alert. */
public interface AlertIndex {

    void add(PriceAlert alert);

    void remove(Long alertId, String symbol);

    /** Ids of alerts on this symbol whose condition is met at this price. */
    Set<Long> findTriggered(String symbol, BigDecimal price);
}
