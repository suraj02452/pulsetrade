package com.pulsetrade.controller;

import com.pulsetrade.dto.response.NotificationResponse;
import com.pulsetrade.dto.response.UnreadCountResponse;
import com.pulsetrade.security.AuthUser;
import com.pulsetrade.service.NotificationService;

import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal AuthUser user,
                                      @RequestParam(defaultValue = "30") int limit) {
        return service.list(user.id(), limit);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal AuthUser user) {
        return new UnreadCountResponse(service.unreadCount(user.id()));
    }

    @PostMapping("/{id}/read")
    public NotificationResponse markRead(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return service.markRead(user.id(), id);
    }

    @PostMapping("/read-all")
    public Map<String, Integer> markAllRead(@AuthenticationPrincipal AuthUser user) {
        return Map.of("updated", service.markAllRead(user.id()));
    }
}
