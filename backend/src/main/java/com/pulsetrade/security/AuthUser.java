package com.pulsetrade.security;

import java.security.Principal;

/**
 * The authenticated user, taken from the JWT. Implementing {@link Principal} with the email
 * as the name lets Spring route {@code /user/queue/...} WebSocket messages to this user.
 */
public record AuthUser(Long id, String email) implements Principal {

    @Override
    public String getName() {
        return email;
    }
}
