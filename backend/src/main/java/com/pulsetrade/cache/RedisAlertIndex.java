package com.pulsetrade.cache;

import com.pulsetrade.entity.AlertCondition;
import com.pulsetrade.entity.PriceAlert;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Alerts live in two Redis sorted sets per symbol, scored by target price:
 * <ul>
 *   <li>alerts:BTCUSDT:ABOVE: fires for every target at or below the current price</li>
 *   <li>alerts:BTCUSDT:BELOW: fires for every target at or above the current price</li>
 * </ul>
 * Each tick is then a range query, O(log n + matches), instead of a loop over every alert.
 */
@Component
public class RedisAlertIndex implements AlertIndex {

    private final StringRedisTemplate redis;

    public RedisAlertIndex(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public void add(PriceAlert alert) {
        redis.opsForZSet().add(key(alert.getSymbol(), alert.getCondition()),
                alert.getId().toString(), alert.getTargetPrice().doubleValue());
    }

    @Override
    public void remove(Long alertId, String symbol) {
        String member = alertId.toString();
        redis.opsForZSet().remove(key(symbol, AlertCondition.ABOVE), member);
        redis.opsForZSet().remove(key(symbol, AlertCondition.BELOW), member);
    }

    @Override
    public Set<Long> findTriggered(String symbol, BigDecimal price) {
        double p = price.doubleValue();
        Set<Long> ids = new HashSet<>();
        collect(ids, redis.opsForZSet().rangeByScore(key(symbol, AlertCondition.ABOVE), Double.NEGATIVE_INFINITY, p));
        collect(ids, redis.opsForZSet().rangeByScore(key(symbol, AlertCondition.BELOW), p, Double.POSITIVE_INFINITY));
        return ids;
    }

    private static void collect(Set<Long> into, Set<String> members) {
        if (members != null) {
            members.forEach(m -> into.add(Long.valueOf(m)));
        }
    }

    private static String key(String symbol, AlertCondition condition) {
        return "alerts:" + symbol + ":" + condition.name();
    }
}
