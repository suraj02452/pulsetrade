package com.pulsetrade.service;

import com.pulsetrade.dto.response.WatchlistItemResponse;
import com.pulsetrade.entity.WatchlistItem;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.exception.NotFoundException;
import com.pulsetrade.repository.WatchlistRepository;
import com.pulsetrade.util.Symbols;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WatchlistService {

    private final WatchlistRepository repository;
    private final PriceCacheService priceCache;

    public WatchlistService(WatchlistRepository repository, PriceCacheService priceCache) {
        this.repository = repository;
        this.priceCache = priceCache;
    }

    @Transactional(readOnly = true)
    public List<WatchlistItemResponse> list(Long userId) {
        return repository.findByUserIdOrderByPositionAscAddedAtAsc(userId).stream().map(this::toDto).toList();
    }

    /** Idempotent: adding a symbol that is already there returns the existing item. */
    @Transactional
    public WatchlistItemResponse add(Long userId, String rawSymbol) {
        String symbol = Symbols.normalize(rawSymbol);
        WatchlistItem item = repository.findByUserIdAndSymbol(userId, symbol)
                .orElseGet(() -> repository.save(
                        new WatchlistItem(userId, symbol, (int) repository.countByUserId(userId))));
        return toDto(item);
    }

    @Transactional
    public void remove(Long userId, String rawSymbol) {
        String symbol = Symbols.normalize(rawSymbol);
        WatchlistItem item = repository.findByUserIdAndSymbol(userId, symbol)
                .orElseThrow(() -> new NotFoundException(symbol + " is not in your watchlist"));
        repository.delete(item);
    }

    /** Saves the drag-and-drop order from the UI. Symbols not listed keep their place at the end. */
    @Transactional
    public List<WatchlistItemResponse> reorder(Long userId, List<String> orderedSymbols) {
        List<WatchlistItem> items = repository.findByUserIdOrderByPositionAscAddedAtAsc(userId);
        Map<String, Integer> order = new HashMap<>();
        for (int i = 0; i < orderedSymbols.size(); i++) {
            order.putIfAbsent(Symbols.normalize(orderedSymbols.get(i)), i);
        }
        int next = order.size();
        for (WatchlistItem item : items) {
            Integer position = order.get(item.getSymbol());
            item.setPosition(position != null ? position : next++);
        }
        return list(userId);
    }

    private WatchlistItemResponse toDto(WatchlistItem item) {
        Optional<PriceTick> tick = priceCache.find(item.getSymbol());
        return new WatchlistItemResponse(item.getId(), item.getSymbol(), item.getPosition(), item.getAddedAt(),
                tick.map(PriceTick::price).orElse(null), tick.map(PriceTick::change24h).orElse(null));
    }
}
