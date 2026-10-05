package com.pulsetrade.repository;

import com.pulsetrade.entity.AlertStatus;
import com.pulsetrade.entity.PriceAlert;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PriceAlertRepository extends JpaRepository<PriceAlert, Long> {

    List<PriceAlert> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<PriceAlert> findByIdAndUserId(Long id, Long userId);

    List<PriceAlert> findByStatus(AlertStatus status);

    /**
     * Flips ACTIVE to TRIGGERED atomically. Returns 1 only for the first caller, so even if two
     * ticks (or two instances) race on the same alert, the user is notified exactly once.
     */
    @Modifying
    @Query("""
            update PriceAlert a
               set a.status = com.pulsetrade.entity.AlertStatus.TRIGGERED,
                   a.triggeredAt = :at,
                   a.triggeredPrice = :price
             where a.id = :id and a.status = com.pulsetrade.entity.AlertStatus.ACTIVE
            """)
    int markTriggered(Long id, BigDecimal price, Instant at);
}
