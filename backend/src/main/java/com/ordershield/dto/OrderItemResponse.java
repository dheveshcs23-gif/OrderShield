package com.ordershield.dto;

import com.ordershield.entity.OrderItem;
import java.math.BigDecimal;

public record OrderItemResponse(
    Long id,
    Long productId,
    String productName,
    String productImageUrl,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal subtotal
) {
    public static OrderItemResponse fromEntity(OrderItem item) {
        return new OrderItemResponse(
            item.getId(),
            item.getProduct().getId(),
            item.getProductName(),
            item.getProductImageUrl(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getSubtotal()
        );
    }
}
