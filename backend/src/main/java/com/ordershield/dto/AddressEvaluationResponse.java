package com.ordershield.dto;

public record AddressEvaluationResponse(
    boolean isProtected,
    boolean isOwner,
    boolean isHouseholdMember,
    String ownerDisplayName,
    String ownerPhone,
    String label,
    String reason
) {}
