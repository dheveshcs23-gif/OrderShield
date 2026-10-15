package com.ordershield.dto;

import com.ordershield.entity.Order;
import com.ordershield.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    Long id,
    String orderNumber,
    Long userId,
    String userEmail,
    String userName,
    OrderStatus status,
    BigDecimal totalAmount,
    Boolean isDispatchBlocked,
    String dispatchBlockedReason,
    ShippingAddressDto shippingAddress,
    List<OrderItemResponse> items,
    Long authorizationRequestId,
    String ownerName,
    String ownerPhone,
    String ownerEmail,
    Long ownerId,
    Instant createdAt,
    Instant dispatchedAt
) {
    public static OrderResponse fromEntity(Order order, Long authReqId) {
        return fromEntity(order, authReqId, null, null, null, null);
    }

    public static OrderResponse fromEntity(Order order, Long authReqId, String ownerName, String ownerPhone) {
        return fromEntity(order, authReqId, ownerName, ownerPhone, null, null);
    }

    public static OrderResponse fromEntity(Order order, Long authReqId, String ownerName, String ownerPhone, String ownerEmail, Long ownerId) {
        ShippingAddressDto ship = new ShippingAddressDto(
            order.getShippingFullName(),
            order.getShippingStreetLine(),
            order.getShippingUnit(),
            order.getShippingCity(),
            order.getShippingState(),
            order.getShippingPostalCode(),
            order.getShippingCountry(),
            order.getShippingPhone()
        );

        List<OrderItemResponse> itemList = order.getItems().stream()
            .map(OrderItemResponse::fromEntity)
            .toList();

        return new OrderResponse(
            order.getId(),
            order.getOrderNumber(),
            order.getUser().getId(),
            order.getUser().getEmail(),
            order.getUser().getFullName(),
            order.getStatus(),
            order.getTotalAmount(),
            order.getIsDispatchBlocked(),
            order.getDispatchBlockedReason(),
            ship,
            itemList,
            authReqId,
            ownerName,
            ownerPhone,
            ownerEmail,
            ownerId,
            order.getCreatedAt(),
            order.getDispatchedAt()
        );
    }
}
