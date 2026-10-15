package com.ordershield.dto;

import com.ordershield.entity.Role;
import com.ordershield.entity.User;

import java.time.Instant;

public record UserResponse(
    Long id,
    String email,
    String fullName,
    String phone,
    Role role,
    Instant createdAt
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getPhone(),
            user.getRole(),
            user.getCreatedAt()
        );
    }
}
