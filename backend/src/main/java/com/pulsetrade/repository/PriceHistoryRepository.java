package com.pulsetrade.repository;

import com.pulsetrade.entity.PriceHistory;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

    List<PriceHistory> findBySymbolAndRecordedAtAfterOrderByRecordedAtAsc(String symbol, Instant after);

    @Modifying
    @Transactional
    @Query("delete from PriceHistory p where p.recordedAt < :cutoff")
    int deleteOlderThan(Instant cutoff);
}
