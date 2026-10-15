package com.ordershield.dto;

import jakarta.validation.constraints.NotBlank;

public record OtpVerificationRequest(
    @NotBlank(message = "OTP code is required")
    String otpCode
) {}
