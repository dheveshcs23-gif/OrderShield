package com.ordershield.controller;

import com.ordershield.entity.Notification;
import com.ordershield.entity.User;
import com.ordershield.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser.getId()));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/clear")
    public ResponseEntity<Void> clearAll(
            @AuthenticationPrincipal User currentUser) {
        notificationService.clearAllForUser(currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        notificationService.deleteNotification(id, currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok().build();
    }
}
