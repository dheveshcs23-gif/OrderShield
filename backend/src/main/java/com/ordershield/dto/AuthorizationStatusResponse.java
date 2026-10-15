package com.ordershield.dto;

public record AuthorizationStatusResponse(
    Long id,
    String orderNumber,
    Long orderId,
    String status,
    String ownerName,
    String ownerPhoneMasked,
    String ownerPhone,
    String buyerName,
    String otpCode,
    Boolean isVerified,
    String message
) {}
