package com.pulsetrade.dto.response;

import com.pulsetrade.entity.User;

import java.time.Instant;

public record UserResponse(Long id, String email, String name, Instant createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getCreatedAt());
    }
}
