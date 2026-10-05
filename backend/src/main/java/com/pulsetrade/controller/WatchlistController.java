package com.pulsetrade.controller;

import com.pulsetrade.dto.request.AddWatchlistRequest;
import com.pulsetrade.dto.request.ReorderWatchlistRequest;
import com.pulsetrade.dto.response.WatchlistItemResponse;
import com.pulsetrade.security.AuthUser;
import com.pulsetrade.service.WatchlistService;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistService service;

    public WatchlistController(WatchlistService service) {
        this.service = service;
    }

    @GetMapping
    public List<WatchlistItemResponse> list(@AuthenticationPrincipal AuthUser user) {
        return service.list(user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WatchlistItemResponse add(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody AddWatchlistRequest request) {
        return service.add(user.id(), request.symbol());
    }

    @PutMapping("/order")
    public List<WatchlistItemResponse> reorder(@AuthenticationPrincipal AuthUser user,
                                          @Valid @RequestBody ReorderWatchlistRequest request) {
        return service.reorder(user.id(), request.symbols());
    }

    @DeleteMapping("/{symbol}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AuthUser user, @PathVariable String symbol) {
        service.remove(user.id(), symbol);
    }
}
