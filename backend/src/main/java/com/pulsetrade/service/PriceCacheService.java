package com.pulsetrade.service;

import com.pulsetrade.event.PriceTick;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/** Latest price per symbol, kept in a Redis hash so REST reads never touch MySQL or Kafka. */
@Service
public class PriceCacheService {

    private static final Logger log = LoggerFactory.getLogger(PriceCacheService.class);
    private static final String KEY = "prices:latest";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public PriceCacheService(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    public void save(PriceTick tick) {
        try {
            redis.opsForHash().put(KEY, tick.symbol(), objectMapper.writeValueAsString(tick));
        } catch (JsonProcessingException e) {
            log.warn("Could not cache tick for {}", tick.symbol(), e);
        }
    }

    public List<PriceTick> findAll() {
        Map<Object, Object> entries = redis.opsForHash().entries(KEY);
        List<PriceTick> ticks = new ArrayList<>(entries.size());
        entries.values().forEach(v -> read((String) v).ifPresent(ticks::add));
        ticks.sort(Comparator.comparing(PriceTick::symbol));
        return ticks;
    }

    public Optional<PriceTick> find(String symbol) {
        Object value = redis.opsForHash().get(KEY, symbol);
        return value == null ? Optional.empty() : read((String) value);
    }

    public Optional<BigDecimal> currentPrice(String symbol) {
        return find(symbol).map(PriceTick::price);
    }

    private Optional<PriceTick> read(String json) {
        try {
            return Optional.of(objectMapper.readValue(json, PriceTick.class));
        } catch (JsonProcessingException e) {
            return Optional.empty();
        }
    }
}
