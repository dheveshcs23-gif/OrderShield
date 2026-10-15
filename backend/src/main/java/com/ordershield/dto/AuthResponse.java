package com.ordershield.dto;

public record AuthResponse(
    String token,
    UserResponse user
) {}
