package com.pulsetrade.dto.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderWatchlistRequest(@NotEmpty List<String> symbols) {}
