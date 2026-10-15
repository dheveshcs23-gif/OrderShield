package com.ordershield.controller;

import com.ordershield.dto.AddressEvaluationResponse;
import com.ordershield.dto.DecisionRequest;
import com.ordershield.dto.MemberInviteRequest;
import com.ordershield.dto.ProtectedAddressRequest;
import com.ordershield.dto.ShippingAddressDto;
import com.ordershield.entity.*;
import com.ordershield.service.AuditLogService;
import com.ordershield.service.OrderShieldSecurityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shield")
public class OrderShieldController {

    private final OrderShieldSecurityService securityService;
    private final AuditLogService auditLogService;

    public OrderShieldController(OrderShieldSecurityService securityService, AuditLogService auditLogService) {
        this.securityService = securityService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/protected-addresses")
    public ResponseEntity<List<ProtectedAddress>> getMyProtectedAddresses(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(securityService.getAddressesByOwner(currentUser.getEmail()));
    }

    @PostMapping("/protected-addresses")
    public ResponseEntity<ProtectedAddress> registerProtectedAddress(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ProtectedAddressRequest request) {
        return ResponseEntity.ok(securityService.registerProtectedAddress(currentUser, request));
    }

    @DeleteMapping("/protected-addresses/{id}")
    public ResponseEntity<Void> deleteProtectedAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        securityService.deleteProtectedAddress(currentUser, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/evaluate-address")
    public ResponseEntity<AddressEvaluationResponse> evaluateAddress(
            @AuthenticationPrincipal User currentUser,
            @RequestBody ShippingAddressDto address) {
        return ResponseEntity.ok(securityService.evaluateAddress(address, currentUser));
    }

    @GetMapping("/members")
    public ResponseEntity<List<TrustedHouseholdMember>> getMembers(
            @RequestParam(required = false) Long addressId) {
        if (addressId != null) {
            return ResponseEntity.ok(securityService.getMembersByAddress(addressId));
        }
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/members/invite")
    public ResponseEntity<TrustedHouseholdMember> inviteMember(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody MemberInviteRequest request) {
        return ResponseEntity.ok(securityService.inviteMember(currentUser, request));
    }

    @PostMapping("/members/{id}/revoke")
    public ResponseEntity<Void> revokeMember(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        securityService.revokeMember(currentUser, id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/members/{id}/grant")
    public ResponseEntity<Void> grantMember(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        securityService.grantMember(currentUser, id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/members/{id}")
    public ResponseEntity<Void> deleteMember(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        securityService.deleteMember(currentUser, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/requests")
    public ResponseEntity<List<AuthorizationRequest>> getPendingRequests(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(securityService.getPendingRequestsForOwner(currentUser.getEmail()));
    }

    @PostMapping("/requests/{id}/decision")
    public ResponseEntity<AuthorizationRequest> decideRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody DecisionRequest request) {
        return ResponseEntity.ok(securityService.decideRequest(id, request.decision(), request.notes(), currentUser));
    }

    @PostMapping("/requests/{id}/allow")
    public ResponseEntity<AuthorizationRequest> allowRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(securityService.allowAndGenerateOtp(id, currentUser));
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<AuthorizationRequest> rejectRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @RequestBody(required = false) DecisionRequest request) {
        String notes = request != null ? request.notes() : "Rejected by homeowner";
        return ResponseEntity.ok(securityService.decideRequest(id, "REJECTED", notes, currentUser));
    }

    @PostMapping("/requests/{id}/verify-otp")
    public ResponseEntity<AuthorizationRequest> verifyOtp(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody com.ordershield.dto.OtpVerificationRequest request) {
        return ResponseEntity.ok(securityService.verifyOtp(id, request.otpCode(), currentUser));
    }

    @GetMapping("/requests/{id}/status")
    public ResponseEntity<com.ordershield.dto.AuthorizationStatusResponse> getRequestStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(securityService.getRequestStatus(id, currentUser));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @DeleteMapping("/audit-logs/{id}")
    public ResponseEntity<Void> deleteAuditLog(
            @PathVariable Long id) {
        auditLogService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/audit-logs")
    public ResponseEntity<Void> clearAuditLogs() {
        auditLogService.clearAll();
        return ResponseEntity.noContent().build();
    }
}
