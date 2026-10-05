package com.pulsetrade.controller;

import com.pulsetrade.dto.request.AddHoldingRequest;
import com.pulsetrade.dto.response.HoldingResponse;
import com.pulsetrade.dto.response.PortfolioSummaryResponse;
import com.pulsetrade.security.AuthUser;
import com.pulsetrade.service.PortfolioService;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService service;

    public PortfolioController(PortfolioService service) {
        this.service = service;
    }

    @GetMapping
    public List<HoldingResponse> list(@AuthenticationPrincipal AuthUser user) {
        return service.list(user.id());
    }

    @GetMapping("/summary")
    public PortfolioSummaryResponse summary(@AuthenticationPrincipal AuthUser user) {
        return service.summary(user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HoldingResponse add(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody AddHoldingRequest request) {
        return service.add(user.id(), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        service.delete(user.id(), id);
    }
}
