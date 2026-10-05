package com.pulsetrade.client;

import com.pulsetrade.TestProps;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.kafka.PricePublisher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class BinancePriceStreamClientTest {

    private final PricePublisher publisher = mock(PricePublisher.class);
    private final BinancePriceStreamClient client = new BinancePriceStreamClient(
            TestProps.appProperties(), publisher, new PriceFeedStatus(TestProps.appProperties()), new ObjectMapper());

    @Test
    void convertsMiniTickerIntoPriceTick() {
        client.handleMessage("""
                {"stream":"btcusdt@miniTicker","data":{"e":"24hrMiniTicker","E":1727680000000,
                 "s":"BTCUSDT","c":"64231.55000000","o":"62781.00000000","h":"65000","l":"62000",
                 "v":"100","q":"6400000"}}
                """);

        ArgumentCaptor<PriceTick> captor = ArgumentCaptor.forClass(PriceTick.class);
        verify(publisher).publish(captor.capture());
        PriceTick tick = captor.getValue();
        assertThat(tick.symbol()).isEqualTo("BTCUSDT");
        assertThat(tick.price()).isEqualByComparingTo("64231.55");
        assertThat(tick.change24h()).isEqualByComparingTo(new BigDecimal("2.31"));
        assertThat(tick.high24h()).isEqualByComparingTo("65000");
        assertThat(tick.low24h()).isEqualByComparingTo("62000");
        assertThat(tick.volume24h()).isEqualByComparingTo("6400000");
        assertThat(tick.timestamp()).isEqualTo(1727680000000L);
    }

    @Test
    void watchdogDoesNothingBeforeAnyConnection() {
        assertThat(client.checkForStall()).isFalse();
    }

    @Test
    void ignoresNonTickerMessages() {
        client.handleMessage("{\"result\":null,\"id\":1}");
        client.handleMessage("garbage");
        verify(publisher, never()).publish(any());
    }
}
