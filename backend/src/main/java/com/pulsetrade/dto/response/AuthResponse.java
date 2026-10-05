package com.pulsetrade.dto.response;

/** Matches the frontend contract: { token, user }. */
public record AuthResponse(String token, UserResponse user) {}
