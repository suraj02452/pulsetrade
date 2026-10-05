package com.pulsetrade.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsetrade.dto.response.CandleResponse;
import com.pulsetrade.dto.response.PricePointResponse;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;

class PriceServiceTest {

    private static final long MINUTE = 60_000;

    @Test
    void parsesSupportedRanges() {
        assertThat(PriceService.ChartRange.parse("1h").span()).isEqualTo(Duration.ofHours(1));
        assertThat(PriceService.ChartRange.parse("1h").candle()).isEqualTo(Duration.ofMinutes(2));
        assertThat(PriceService.ChartRange.parse("24H").candle()).isEqualTo(Duration.ofMinutes(30));
        assertThat(PriceService.ChartRange.parse("7d").span()).isEqualTo(Duration.ofDays(7));
        assertThat(PriceService.ChartRange.parse(null).span()).isEqualTo(Duration.ofHours(24));
        assertThatThrownBy(() -> PriceService.ChartRange.parse("1y")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void groupsSamplesIntoOhlcCandles() {
        List<PricePointResponse> points = List.of(
                point(0, "100"), point(MINUTE / 2, "105"), point(MINUTE, "98"), point(MINUTE + 30_000, "101"),
                point(2 * MINUTE, "110"));

        List<CandleResponse> candles = PriceService.toCandles(points, 2 * MINUTE);

        assertThat(candles).hasSize(2);
        CandleResponse first = candles.get(0);
        assertThat(first.time()).isZero();
        assertThat(first.open()).isEqualByComparingTo("100");
        assertThat(first.high()).isEqualByComparingTo("105");
        assertThat(first.low()).isEqualByComparingTo("98");
        assertThat(first.close()).isEqualByComparingTo("101");
        assertThat(candles.get(1).time()).isEqualTo(2 * MINUTE);
        assertThat(candles.get(1).open()).isEqualByComparingTo("110");
    }

    @Test
    void noSamplesMeansNoCandles() {
        assertThat(PriceService.toCandles(List.of(), MINUTE)).isEmpty();
    }

    private static PricePointResponse point(long time, String price) {
        return new PricePointResponse(time, new BigDecimal(price));
    }
}
