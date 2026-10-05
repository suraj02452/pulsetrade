package com.pulsetrade.security;

import com.pulsetrade.TestProps;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(TestProps.appProperties());

    @Test
    void roundTripsUserIdAndEmail() {
        String token = jwtService.generateToken(42L, "suraj@example.com");

        assertThat(jwtService.parse(token))
                .hasValueSatisfying(user -> {
                    assertThat(user.id()).isEqualTo(42L);
                    assertThat(user.email()).isEqualTo("suraj@example.com");
                    assertThat(user.getName()).isEqualTo("suraj@example.com");
                });
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.generateToken(1L, "a@b.com");
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.parse(tampered)).isEmpty();
        assertThat(jwtService.parse("not-a-jwt")).isEmpty();
        assertThat(jwtService.parse(null)).isEmpty();
    }

    @Test
    void stripsBearerPrefix() {
        assertThat(JwtService.extractToken("Bearer abc.def")).isEqualTo("abc.def");
        assertThat(JwtService.extractToken("abc.def")).isEqualTo("abc.def");
        assertThat(JwtService.extractToken(null)).isNull();
    }
}
