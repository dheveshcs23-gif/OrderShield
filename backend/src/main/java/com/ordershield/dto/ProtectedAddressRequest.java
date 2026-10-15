package com.ordershield.dto;

import jakarta.validation.constraints.NotBlank;

public record ProtectedAddressRequest(
    @NotBlank(message = "Label is required")
    String label,

    @NotBlank(message = "Street address is required")
    String streetLine,

    String unit,

    @NotBlank(message = "City is required")
    String city,

    @NotBlank(message = "State is required")
    String state,

    @NotBlank(message = "Postal code is required")
    String postalCode,

    String country,

    String phone
) {}
