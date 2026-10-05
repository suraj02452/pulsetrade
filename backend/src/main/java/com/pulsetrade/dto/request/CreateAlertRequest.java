package com.pulsetrade.dto.request;

import com.pulsetrade.entity.AlertCondition;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateAlertRequest(
        @NotBlank String symbol,
        @NotNull AlertCondition condition,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal targetPrice) {}
