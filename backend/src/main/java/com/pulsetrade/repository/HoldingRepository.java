package com.pulsetrade.repository;

import com.pulsetrade.entity.Holding;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoldingRepository extends JpaRepository<Holding, Long> {

    List<Holding> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Holding> findByIdAndUserId(Long id, Long userId);
}
