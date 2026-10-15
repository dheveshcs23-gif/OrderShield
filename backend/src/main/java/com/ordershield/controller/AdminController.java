package com.ordershield.controller;

import com.ordershield.dto.OrderResponse;
import com.ordershield.entity.AuditLog;
import com.ordershield.entity.User;
import com.ordershield.service.AuditLogService;
import com.ordershield.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final OrderService orderService;
    private final AuditLogService auditLogService;

    public AdminController(OrderService orderService, AuditLogService auditLogService) {
        this.orderService = orderService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PostMapping("/orders/{id}/dispatch")
    public ResponseEntity<OrderResponse> dispatchOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(orderService.dispatchOrder(id, currentUser));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<OrderResponse> allOrders = orderService.getAllOrders();
        long blockedCount = allOrders.stream().filter(OrderResponse::isDispatchBlocked).count();
        long dispatchedCount = allOrders.stream()
                .filter(o -> "DISPATCHED".equals(o.status().name()) || "DELIVERED".equals(o.status().name()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", allOrders.size());
        stats.put("blockedOrders", blockedCount);
        stats.put("dispatchedOrders", dispatchedCount);

        return ResponseEntity.ok(stats);
    }
}
