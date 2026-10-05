package com.pulsetrade.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AddWatchlistRequest(@NotBlank String symbol) {}
