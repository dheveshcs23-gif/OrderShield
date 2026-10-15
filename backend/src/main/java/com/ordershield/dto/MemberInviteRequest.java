package com.ordershield.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MemberInviteRequest(
    @NotNull(message = "Protected address ID is required")
    Long protectedAddressId,

    @NotBlank(message = "Member name is required")
    String memberName,

    @NotBlank(message = "Member mobile number is required")
    String memberPhone,

    String memberEmail,
    String relationship
) {}
