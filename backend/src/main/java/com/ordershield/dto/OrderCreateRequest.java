package com.ordershield.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record OrderCreateRequest(
    @NotNull(message = "Shipping address is required")
    @Valid
    ShippingAddressDto shippingAddress,

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    List<OrderItemRequest> items
) {}
