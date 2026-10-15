package com.ordershield.service;

import com.ordershield.entity.Notification;
import com.ordershield.entity.NotificationType;
import com.ordershield.entity.User;
import com.ordershield.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification notifyUser(User user, NotificationType type, String title, String message, Long relatedEntityId) {
        Notification notification = new Notification(user, type, title, message, relatedEntityId);
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId, String email) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            boolean matchesUser = n.getUser().getId().equals(userId);
            boolean matchesEmail = email != null && n.getUser() != null &&
                    n.getUser().getEmail() != null && n.getUser().getEmail().equalsIgnoreCase(email);
            if (matchesUser || matchesEmail) {
                notificationRepository.delete(n);
            }
        });
    }

    @Transactional
    public void clearAllForUser(Long userId, String email) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notificationRepository.deleteAll(list);
        if (email != null && !email.isBlank()) {
            List<Notification> all = notificationRepository.findAll();
            for (Notification n : all) {
                if (n.getUser() != null && n.getUser().getEmail() != null &&
                        n.getUser().getEmail().equalsIgnoreCase(email)) {
                    notificationRepository.delete(n);
                }
            }
        }
    }
}
