package com.ordershield.controller;

import com.ordershield.dto.OrderCreateRequest;
import com.ordershield.dto.OrderResponse;
import com.ordershield.entity.User;
import com.ordershield.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody OrderCreateRequest request) {
        return ResponseEntity.ok(orderService.createOrder(currentUser, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(orderService.getMyOrders(currentUser));
    }

    @GetMapping("/all")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(orderService.getOrderById(id, currentUser));
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<OrderResponse> dispatchOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(orderService.dispatchOrder(id, currentUser));
    }
}
