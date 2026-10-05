package com.pulsetrade.dto.response;

import java.math.BigDecimal;

public record PortfolioSummaryResponse(BigDecimal totalInvested, BigDecimal totalValue, BigDecimal totalProfitLoss,
                                       BigDecimal totalProfitLossPercent, int holdings) {}
