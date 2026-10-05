package com.pulsetrade.controller;

import com.pulsetrade.client.PriceFeedStatus;
import com.pulsetrade.dto.response.CandleResponse;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.service.PriceService;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prices")
public class PriceController {

    private final PriceService priceService;
    private final PriceFeedStatus feedStatus;

    public PriceController(PriceService priceService, PriceFeedStatus feedStatus) {
        this.priceService = priceService;
        this.feedStatus = feedStatus;
    }

    @GetMapping
    public List<PriceTick> latest() {
        return priceService.latestPrices();
    }

    @GetMapping("/status")
    public PriceFeedStatus.Snapshot status() {
        return feedStatus.snapshot();
    }

    @GetMapping("/{symbol}")
    public PriceTick latest(@PathVariable String symbol) {
        return priceService.latestPrice(symbol);
    }

    @GetMapping("/{symbol}/history")
    public List<CandleResponse> history(@PathVariable String symbol,
                                    @RequestParam(defaultValue = "24h") String range) {
        return priceService.history(symbol, range);
    }
}
