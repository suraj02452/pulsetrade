package com.pulsetrade.dto.response;

import com.pulsetrade.entity.Notification;

import java.time.Instant;

public record NotificationResponse(Long id, Long alertId, String message, boolean read, Instant createdAt) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getAlertId(), n.getMessage(), n.isRead(), n.getCreatedAt());
    }
}
