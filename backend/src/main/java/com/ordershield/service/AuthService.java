package com.ordershield.service;

import com.ordershield.config.JwtTokenProvider;
import com.ordershield.dto.AuthRequest;
import com.ordershield.dto.AuthResponse;
import com.ordershield.dto.RegisterRequest;
import com.ordershield.dto.UserResponse;
import com.ordershield.entity.Role;
import com.ordershield.entity.User;
import com.ordershield.exception.ApiException;
import com.ordershield.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.auditLogService = auditLogService;
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
        );

        User user = (User) authentication.getPrincipal();
        String token = tokenProvider.generateToken(authentication);

        auditLogService.record(user.getEmail(), "USER_LOGIN", "USER", user.getId().toString(), "User logged in successfully");

        return new AuthResponse(token, UserResponse.fromEntity(user));
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException("Email is already registered. Please sign in.");
        }

        User user = new User(
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                request.phone(),
                Role.ROLE_CUSTOMER
        );

        User savedUser = userRepository.save(user);
        String token = tokenProvider.generateTokenForEmail(savedUser.getEmail(), savedUser.getRole().name());

        auditLogService.record(savedUser.getEmail(), "USER_REGISTERED", "USER", savedUser.getId().toString(), "New customer account registered");

        return new AuthResponse(token, UserResponse.fromEntity(savedUser));
    }

    public UserResponse getProfile(User currentUser) {
        return UserResponse.fromEntity(currentUser);
    }
}
