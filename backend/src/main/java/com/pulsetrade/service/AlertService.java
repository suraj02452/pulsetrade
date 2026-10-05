package com.pulsetrade.service;

import com.pulsetrade.cache.AlertIndex;
import com.pulsetrade.dto.request.CreateAlertRequest;
import com.pulsetrade.dto.response.AlertResponse;
import com.pulsetrade.entity.AlertStatus;
import com.pulsetrade.entity.PriceAlert;
import com.pulsetrade.exception.NotFoundException;
import com.pulsetrade.repository.PriceAlertRepository;
import com.pulsetrade.util.Symbols;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final PriceAlertRepository repository;
    private final AlertIndex index;

    public AlertService(PriceAlertRepository repository, AlertIndex index) {
        this.repository = repository;
        this.index = index;
    }

    /** Rebuilds the Redis index from MySQL on startup, so MySQL stays the source of truth. */
    @EventListener(ApplicationReadyEvent.class)
    public void rebuildIndex() {
        List<PriceAlert> active = repository.findByStatus(AlertStatus.ACTIVE);
        active.forEach(index::add);
        log.info("Indexed {} active price alerts", active.size());
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> list(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(AlertResponse::from).toList();
    }

    @Transactional
    public AlertResponse create(Long userId, CreateAlertRequest request) {
        PriceAlert alert = repository.save(new PriceAlert(
                userId, Symbols.normalize(request.symbol()), request.condition(), request.targetPrice()));
        afterCommit(() -> index.add(alert));
        return AlertResponse.from(alert);
    }

    @Transactional
    public void delete(Long userId, Long alertId) {
        PriceAlert alert = owned(userId, alertId);
        repository.delete(alert);
        afterCommit(() -> index.remove(alert.getId(), alert.getSymbol()));
    }

    @Transactional
    public AlertResponse rearm(Long userId, Long alertId) {
        PriceAlert alert = owned(userId, alertId);
        alert.rearm();
        afterCommit(() -> index.add(alert));
        return AlertResponse.from(alert);
    }

    /** Called by the engine. Returns the alert only if this call is the one that triggered it. */
    @Transactional
    public Optional<PriceAlert> tryTrigger(Long alertId, String symbol, BigDecimal price) {
        index.remove(alertId, symbol);
        if (repository.markTriggered(alertId, price, Instant.now()) == 1) {
            return repository.findById(alertId);
        }
        return Optional.empty();
    }

    /** Updates Redis only once MySQL has committed, so the engine never sees uncommitted alerts. */
    private static void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    private PriceAlert owned(Long userId, Long alertId) {
        return repository.findByIdAndUserId(alertId, userId)
                .orElseThrow(() -> new NotFoundException("Alert " + alertId + " not found"));
    }
}
