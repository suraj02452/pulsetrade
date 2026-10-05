package com.pulsetrade.service;

import com.pulsetrade.dto.request.AddHoldingRequest;
import com.pulsetrade.dto.response.HoldingResponse;
import com.pulsetrade.dto.response.PortfolioSummaryResponse;
import com.pulsetrade.entity.Holding;
import com.pulsetrade.exception.NotFoundException;
import com.pulsetrade.repository.HoldingRepository;
import com.pulsetrade.util.Symbols;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioService {

    private final HoldingRepository repository;
    private final PriceCacheService priceCache;

    public PortfolioService(HoldingRepository repository, PriceCacheService priceCache) {
        this.repository = repository;
        this.priceCache = priceCache;
    }

    @Transactional(readOnly = true)
    public List<HoldingResponse> list(Long userId) {
        return repository.findByUserIdOrderByCreatedAtAsc(userId).stream().map(this::toDto).toList();
    }

    @Transactional
    public HoldingResponse add(Long userId, AddHoldingRequest request) {
        Holding holding = repository.save(new Holding(
                userId, Symbols.normalize(request.symbol()), request.quantity(), request.buyPrice()));
        return toDto(holding);
    }

    @Transactional
    public void delete(Long userId, Long holdingId) {
        Holding holding = repository.findByIdAndUserId(holdingId, userId)
                .orElseThrow(() -> new NotFoundException("Holding " + holdingId + " not found"));
        repository.delete(holding);
    }

    @Transactional(readOnly = true)
    public PortfolioSummaryResponse summary(Long userId) {
        List<HoldingResponse> holdings = list(userId);
        BigDecimal invested = BigDecimal.ZERO;
        BigDecimal value = BigDecimal.ZERO;
        for (HoldingResponse h : holdings) {
            invested = invested.add(h.invested());
            // Without a live price yet, value the holding at cost so totals stay meaningful.
            value = value.add(h.currentValue() != null ? h.currentValue() : h.invested());
        }
        BigDecimal pnl = value.subtract(invested);
        return new PortfolioSummaryResponse(money(invested), money(value), money(pnl), percent(pnl, invested), holdings.size());
    }

    HoldingResponse toDto(Holding h) {
        BigDecimal invested = h.getQuantity().multiply(h.getBuyPrice());
        BigDecimal current = priceCache.currentPrice(h.getSymbol()).orElse(null);
        BigDecimal value = current == null ? null : h.getQuantity().multiply(current);
        BigDecimal pnl = value == null ? null : value.subtract(invested);
        return new HoldingResponse(h.getId(), h.getSymbol(), h.getQuantity().stripTrailingZeros(),
                h.getBuyPrice().stripTrailingZeros(), h.getCreatedAt(), current, money(invested),
                value == null ? null : money(value), pnl == null ? null : money(pnl),
                pnl == null ? null : percent(pnl, invested));
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal percent(BigDecimal part, BigDecimal whole) {
        if (whole.signum() == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(whole, 2, RoundingMode.HALF_UP);
    }
}
