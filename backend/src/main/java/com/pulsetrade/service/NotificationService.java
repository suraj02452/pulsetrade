package com.pulsetrade.service;

import com.pulsetrade.dto.response.NotificationResponse;
import com.pulsetrade.entity.AlertCondition;
import com.pulsetrade.entity.Notification;
import com.pulsetrade.entity.PriceAlert;
import com.pulsetrade.event.AlertTriggeredEvent;
import com.pulsetrade.exception.NotFoundException;
import com.pulsetrade.repository.NotificationRepository;
import com.pulsetrade.repository.UserRepository;
import com.pulsetrade.util.Symbols;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    public static final String USER_ALERTS_DESTINATION = "/queue/alerts";

    private final NotificationRepository repository;
    private final UserRepository users;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailNotifier emailNotifier;

    public NotificationService(NotificationRepository repository, UserRepository users,
                               SimpMessagingTemplate messagingTemplate, EmailNotifier emailNotifier) {
        this.repository = repository;
        this.users = users;
        this.messagingTemplate = messagingTemplate;
        this.emailNotifier = emailNotifier;
    }

    /** Saves an in-app notification, pushes it live over WebSocket, and emails it if enabled. */
    @Transactional
    public void alertTriggered(PriceAlert alert, BigDecimal currentPrice) {
        String message = buildMessage(alert.getSymbol(), alert.getCondition(), alert.getTargetPrice());
        Notification saved = repository.save(new Notification(alert.getUserId(), alert.getId(), message));

        users.findById(alert.getUserId()).ifPresent(user -> {
            AlertTriggeredEvent event = new AlertTriggeredEvent(alert.getId(), alert.getSymbol(),
                    alert.getCondition(), alert.getTargetPrice().stripTrailingZeros(), currentPrice, message,
                    saved.getId(), System.currentTimeMillis());
            // Spring resolves this to the sessions of the user whose Principal name is this email.
            messagingTemplate.convertAndSendToUser(user.getEmail(), USER_ALERTS_DESTINATION, event);
            emailNotifier.send(user.getEmail(), "PulseTrade alert: " + message,
                    message + "\nCurrent price: " + formatUsd(currentPrice));
        });
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long userId, int limit) {
        int size = Math.max(1, Math.min(limit, 100));
        return repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, size))
                .stream().map(NotificationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long id) {
        Notification n = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Notification " + id + " not found"));
        n.markRead();
        return NotificationResponse.from(n);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return repository.markAllRead(userId);
    }

    /** e.g. "ETH dropped below $2,500" or "BTC rose above $70,000". */
    static String buildMessage(String symbol, AlertCondition condition, BigDecimal target) {
        String verb = condition == AlertCondition.ABOVE ? "rose above" : "dropped below";
        return Symbols.baseAsset(symbol) + " " + verb + " " + formatUsd(target);
    }

    static String formatUsd(BigDecimal value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.US);
        format.setMaximumFractionDigits(value.abs().compareTo(BigDecimal.ONE) < 0 ? 8 : 2);
        format.setMinimumFractionDigits(0);
        return format.format(value);
    }
}
