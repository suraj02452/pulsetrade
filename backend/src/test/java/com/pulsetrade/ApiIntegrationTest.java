package com.pulsetrade;

import com.pulsetrade.entity.AlertStatus;
import com.pulsetrade.event.PriceTick;
import com.pulsetrade.kafka.AlertEngine;
import com.pulsetrade.repository.NotificationRepository;
import com.pulsetrade.repository.PriceAlertRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;

/**
 * Full-stack test against real MySQL, Redis and Kafka in Docker (Testcontainers).
 * Skipped automatically when Docker isn't available.
 */
@SpringBootTest(properties = "app.prices.source=none")
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class ApiIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");

    @Container
    @ServiceConnection
    static KafkaContainer kafka = new KafkaContainer("apache/kafka:3.8.0");

    @Container
    @ServiceConnection(name = "redis")
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AlertEngine alertEngine;
    @Autowired PriceAlertRepository alertRepository;
    @Autowired NotificationRepository notificationRepository;

    @Test
    void protectedEndpointsRequireToken() throws Exception {
        mvc.perform(get("/api/watchlist")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/prices")).andExpect(status().isOk());
    }

    @Test
    void registerLoginAndUseApi() throws Exception {
        String token = register("trader@example.com");

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"trader@example.com\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("trader@example.com"));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"trader@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/watchlist").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"symbol\":\"btcusdt\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.symbol").value("BTCUSDT"));

        mvc.perform(get("/api/watchlist").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void alertFiresExactlyOnce() throws Exception {
        String token = register("alerts@example.com");

        String body = mvc.perform(post("/api/alerts").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"symbol\":\"ETHUSDT\",\"condition\":\"BELOW\",\"targetPrice\":2500}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long alertId = objectMapper.readTree(body).get("id").asLong();

        // Price bounces around the target several times: only one notification must be created.
        alertEngine.onTick(tick("2600", 1L));
        alertEngine.onTick(tick("2499", 2L));
        alertEngine.onTick(tick("2490", 3L));

        assertThat(alertRepository.findById(alertId)).hasValueSatisfying(
                a -> assertThat(a.getStatus()).isEqualTo(AlertStatus.TRIGGERED));
        assertThat(notificationRepository.findAll())
                .filteredOn(n -> n.getAlertId() == alertId)
                .hasSize(1)
                .first().satisfies(n -> assertThat(n.getMessage()).isEqualTo("ETH dropped below $2,500"));
    }

    private static PriceTick tick(String price, long timestamp) {
        BigDecimal p = new BigDecimal(price);
        return new PriceTick("ETHUSDT", p, BigDecimal.ZERO, p, p, BigDecimal.ZERO, timestamp);
    }

    private String register(String email) throws Exception {
        String response = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test\",\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.get("token").asText();
    }
}
