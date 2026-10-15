package com.ordershield;

import com.ordershield.dto.*;
import com.ordershield.entity.*;
import com.ordershield.exception.SecurityViolationException;
import com.ordershield.repository.*;
import com.ordershield.service.OrderService;
import com.ordershield.service.OrderShieldSecurityService;
import com.ordershield.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class OrderShieldSecurityWorkflowTests {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderShieldSecurityService securityService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private TrustedHouseholdMemberRepository householdMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AuthorizationRequestRepository authReqRepository;

    private User aliceOwner;
    private User bobHousehold;
    private User malloryStranger;
    private User adminUser;
    private Product testProduct;
    private ShippingAddressDto evergreenAddress;

    @BeforeEach
    void setUp() {
        aliceOwner = userRepository.findByEmailIgnoreCase("alice@shield.com").orElseThrow();
        bobHousehold = userRepository.findByEmailIgnoreCase("bob@shield.com").orElseThrow();
        malloryStranger = userRepository.findByEmailIgnoreCase("mallory@shield.com").orElseThrow();
        adminUser = userRepository.findByEmailIgnoreCase("admin@ordershield.com").orElseThrow();

        testProduct = productRepository.findAll().get(0);

        evergreenAddress = new ShippingAddressDto(
                "Recipient",
                "742 Evergreen Terrace",
                "Apt 4B",
                "Springfield",
                "OR",
                "97477",
                "United States",
                "+1 555-0199"
        );
        securityService.clearCooldowns();
    }

    @Test
    @DisplayName("Scenario A: Owner orders to own protected address -> normal processing, no alerts, dispatch permitted")
    void testOwnerOrdersToOwnProtectedAddress() {
        OrderCreateRequest request = new OrderCreateRequest(
                evergreenAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse response = orderService.createOrder(aliceOwner, request);

        assertEquals(OrderStatus.PROCESSING, response.status());
        assertFalse(response.isDispatchBlocked(), "Owner order must not be dispatch blocked");
        assertNull(response.authorizationRequestId(), "Owner order must not trigger authorization request");

        // Verify dispatch succeeds
        OrderResponse dispatched = orderService.dispatchOrder(response.id(), adminUser);
        assertEquals(OrderStatus.DISPATCHED, dispatched.status());
    }

    @Test
    @DisplayName("Scenario B: Active trusted household member orders to address -> normal processing, dispatch permitted")
    void testTrustedHouseholdMemberOrdersToAddress() {
        OrderCreateRequest request = new OrderCreateRequest(
                evergreenAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse response = orderService.createOrder(bobHousehold, request);

        assertEquals(OrderStatus.PROCESSING, response.status());
        assertFalse(response.isDispatchBlocked(), "Active household member order must not be dispatch blocked");
        assertNull(response.authorizationRequestId(), "Active member order must not trigger authorization request");

        // Verify dispatch succeeds
        OrderResponse dispatched = orderService.dispatchOrder(response.id(), adminUser);
        assertEquals(OrderStatus.DISPATCHED, dispatched.status());
    }

    @Test
    @DisplayName("Scenario C: Untrusted account orders to protected address -> authorization request created and dispatch blocked")
    void testUntrustedStrangerOrdersToProtectedAddress() {
        OrderCreateRequest request = new OrderCreateRequest(
                evergreenAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse response = orderService.createOrder(malloryStranger, request);

        assertEquals(OrderStatus.PENDING_SECURITY_AUTHORIZATION, response.status());
        assertTrue(response.isDispatchBlocked(), "Stranger order must be dispatch blocked");
        assertNotNull(response.authorizationRequestId(), "Must generate authorization request");

        // Scenario F verification: Attempting dispatch before approval MUST throw SecurityViolationException
        assertThrows(SecurityViolationException.class, () -> {
            orderService.dispatchOrder(response.id(), adminUser);
        }, "Dispatching a blocked order must fail");
    }

    @Test
    @DisplayName("Scenario D: Owner approves pending request -> order becomes eligible for dispatch and succeeds")
    void testOwnerApprovesPendingRequest() {
        OrderCreateRequest request = new OrderCreateRequest(
                evergreenAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse orderRes = orderService.createOrder(malloryStranger, request);
        Long authReqId = orderRes.authorizationRequestId();

        // Alice (owner) approves the request
        AuthorizationRequest decidedReq = securityService.decideRequest(
                authReqId,
                "APPROVED",
                "Verified friend delivery",
                aliceOwner
        );

        assertEquals(AuthorizationRequestStatus.APPROVED, decidedReq.getStatus());

        Order updatedOrder = orderRepository.findById(orderRes.id()).orElseThrow();
        assertEquals(OrderStatus.AUTHORIZATION_APPROVED, updatedOrder.getStatus());
        assertFalse(updatedOrder.getIsDispatchBlocked(), "Dispatch block must be released after owner approval");

        // Now dispatch succeeds
        OrderResponse dispatched = orderService.dispatchOrder(orderRes.id(), adminUser);
        assertEquals(OrderStatus.DISPATCHED, dispatched.status());
    }

    @Test
    @DisplayName("Scenario E: Owner rejects pending request -> order is rejected and dispatch permanently blocked")
    void testOwnerRejectsPendingRequest() {
        OrderCreateRequest request = new OrderCreateRequest(
                evergreenAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse orderRes = orderService.createOrder(malloryStranger, request);
        Long authReqId = orderRes.authorizationRequestId();

        // Alice (owner) rejects the request
        AuthorizationRequest decidedReq = securityService.decideRequest(
                authReqId,
                "REJECTED",
                "Unrecognized sender, do not drop off",
                aliceOwner
        );

        assertEquals(AuthorizationRequestStatus.REJECTED, decidedReq.getStatus());

        Order updatedOrder = orderRepository.findById(orderRes.id()).orElseThrow();
        assertEquals(OrderStatus.AUTHORIZATION_REJECTED, updatedOrder.getStatus());
        assertTrue(updatedOrder.getIsDispatchBlocked(), "Dispatch must remain blocked permanently");

        // Attempting to dispatch must fail
        assertThrows(SecurityViolationException.class, () -> {
            orderService.dispatchOrder(orderRes.id(), adminUser);
        });
    }

    @Test
    @DisplayName("Scenario G: Unauthorized user attempts to approve another owner's request -> access denied")
    void testUnauthorizedUserCannotApproveRequest() {
        OrderCreateRequest request = new OrderCreateRequest(
                evergreenAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse orderRes = orderService.createOrder(malloryStranger, request);
        Long authReqId = orderRes.authorizationRequestId();

        // Mallory (stranger) attempts to approve her own request
        assertThrows(SecurityViolationException.class, () -> {
            securityService.decideRequest(authReqId, "APPROVED", "Self approval attempt", malloryStranger);
        }, "Non-owner user must not be permitted to approve authorization requests");
    }

    @Test
    @DisplayName("Scenario I: Revoked trusted member places a new order -> permission denied and workflow triggered")
    void testRevokedMemberPlacesOrder() {
        // Find Bob's member record and revoke it
        var members = securityService.getMembersByAddress(101L);
        var bobMember = members.stream()
                .filter(m -> m.getMemberEmail().equalsIgnoreCase(bobHousehold.getEmail()))
                .findFirst()
                .orElseThrow();

        securityService.revokeMember(aliceOwner, bobMember.getId());

        // Now Bob places an order to the protected address
        OrderCreateRequest request = new OrderCreateRequest(
                evergreenAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse response = orderService.createOrder(bobHousehold, request);

        assertEquals(OrderStatus.PENDING_SECURITY_AUTHORIZATION, response.status(),
                "Revoked member must trigger authorization workflow");
        assertTrue(response.isDispatchBlocked(), "Revoked member order must be dispatch blocked");
        assertNotNull(response.authorizationRequestId());
    }

    @Test
    @DisplayName("Scenario J: Ajay orders to Dhevesh protected address -> Dhevesh receives alert, clicks Allow -> OTP generated -> Ajay submits OTP -> dispatch unblocked")
    void testDheveshAndAjayOtpWorkflow() {
        User dhevesh = userRepository.findByEmailIgnoreCase("dhevesh@shield.com").orElseThrow();
        User ajay = userRepository.findByEmailIgnoreCase("ajay@shield.com").orElseThrow();

        ShippingAddressDto dheveshAddress = new ShippingAddressDto(
                "Ajay Kumar",
                "42 Lotus Residency, Gandhi Road",
                "Villa 12",
                "Chennai",
                "TN",
                "600001",
                "India",
                "+91 9876500000"
        );

        // 1. Dhevesh orders to own protected address: no block, no alerts
        OrderResponse dheveshOrder = orderService.createOrder(dhevesh, new OrderCreateRequest(
                dheveshAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        ));
        assertEquals(OrderStatus.PROCESSING, dheveshOrder.status());
        assertFalse(dheveshOrder.isDispatchBlocked());
        assertNull(dheveshOrder.authorizationRequestId());

        // 2. Ajay orders to Dhevesh's address: OrderShield triggers, locks dispatch
        OrderResponse ajayOrder = orderService.createOrder(ajay, new OrderCreateRequest(
                dheveshAddress,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        ));
        assertEquals(OrderStatus.PENDING_SECURITY_AUTHORIZATION, ajayOrder.status());
        assertTrue(ajayOrder.isDispatchBlocked());
        assertNotNull(ajayOrder.authorizationRequestId());

        Long requestId = ajayOrder.authorizationRequestId();

        // 3. Dhevesh clicks ALLOW -> OTP is generated and status becomes OTP_SENT
        AuthorizationRequest allowedReq = securityService.allowAndGenerateOtp(requestId, dhevesh);
        assertEquals(AuthorizationRequestStatus.OTP_SENT, allowedReq.getStatus());
        assertNotNull(allowedReq.getOtpCode());
        assertEquals(6, allowedReq.getOtpCode().length());
        assertEquals("+91 9876543210", allowedReq.getOwnerPhone());

        // 4. Ajay inputs wrong OTP -> fails with SecurityViolationException
        assertThrows(SecurityViolationException.class, () -> {
            securityService.verifyOtp(requestId, "000000", ajay);
        });

        // 5. Ajay inputs correct OTP -> status APPROVED, dispatch unblocked!
        AuthorizationRequest approvedReq = securityService.verifyOtp(requestId, allowedReq.getOtpCode(), ajay);
        assertEquals(AuthorizationRequestStatus.APPROVED, approvedReq.getStatus());
        assertTrue(approvedReq.getOtpVerified());

        Order verifiedOrder = orderRepository.findById(ajayOrder.id()).orElseThrow();
        assertEquals(OrderStatus.AUTHORIZATION_APPROVED, verifiedOrder.getStatus());
        assertFalse(verifiedOrder.getIsDispatchBlocked());

        // 6. Admin can now successfully dispatch order
        OrderResponse dispatched = orderService.dispatchOrder(ajayOrder.id(), adminUser);
        assertEquals(OrderStatus.DISPATCHED, dispatched.status());
    }

    @Test
    @DisplayName("Scenario N: Authorize family member with unique mobile number -> matching buyer phone passes without security lock")
    void testMobileNumberMatchedHouseholdMemberPassesImmediately() {
        // Invite a family member by mobile number (+91 9999988888)
        MemberInviteRequest inviteReq = new MemberInviteRequest(
                101L,
                "Sarah Walker",
                "+91 9999988888",
                null,
                null
        );
        TrustedHouseholdMember member = securityService.inviteMember(aliceOwner, inviteReq);
        assertEquals("+91 9999988888", member.getMemberPhone());
        assertEquals(HouseholdMemberStatus.ACTIVE, member.getStatus());

        // Now mallory places order with shipping phone matching Sarah's mobile
        ShippingAddressDto matchingPhoneAddr = new ShippingAddressDto(
                "Sarah Walker",
                "742 Evergreen Terrace",
                "Apt 4B",
                "Springfield",
                "OR",
                "97477",
                "United States",
                "+91 9999988888"
        );

        OrderCreateRequest orderReq = new OrderCreateRequest(
                matchingPhoneAddr,
                List.of(new OrderItemRequest(testProduct.getId(), 1))
        );

        OrderResponse response = orderService.createOrder(malloryStranger, orderReq);
        assertEquals(OrderStatus.PROCESSING, response.status());
        assertFalse(response.isDispatchBlocked(), "Mobile matching family member must pass immediately");
        assertNull(response.authorizationRequestId());
    }

    @Test
    @DisplayName("Scenario O: Delete protected address -> address and its trusted members are removed")
    void testDeleteProtectedAddress() {
        // Create a new address for Alice
        ProtectedAddressRequest req = new ProtectedAddressRequest(
                "Holiday Cabin",
                "10 Pine Road",
                "Cabin 2",
                "Bend",
                "OR",
                "97701",
                "United States",
                "+1 555-0199"
        );
        ProtectedAddress registered = securityService.registerProtectedAddress(aliceOwner, req);
        Long addrId = registered.getId();
        assertNotNull(addrId);

        // Delete address
        securityService.deleteProtectedAddress(aliceOwner, addrId);

        // Verify address is gone
        List<ProtectedAddress> list = securityService.getAddressesByOwner(aliceOwner.getEmail());
        assertTrue(list.stream().noneMatch(a -> a.getId().equals(addrId)));
    }

    @Test
    @DisplayName("Scenario P: Toggle revoke and grant family member, then delete member and clear/delete audit logs")
    void testFamilyMemberToggleAndAuditLogOperations() {
        MemberInviteRequest inviteReq = new MemberInviteRequest(
                101L,
                "Cousin Dave",
                "+91 7777766666",
                "dave@shield.com",
                "Cousin"
        );
        TrustedHouseholdMember member = securityService.inviteMember(aliceOwner, inviteReq);
        assertEquals(HouseholdMemberStatus.ACTIVE, member.getStatus());

        // Revoke
        securityService.revokeMember(aliceOwner, member.getId());
        TrustedHouseholdMember revoked = householdMemberRepository.findById(member.getId()).orElseThrow();
        assertEquals(HouseholdMemberStatus.REVOKED, revoked.getStatus());

        // Grant back (toggle)
        securityService.grantMember(aliceOwner, member.getId());
        TrustedHouseholdMember granted = householdMemberRepository.findById(member.getId()).orElseThrow();
        assertEquals(HouseholdMemberStatus.ACTIVE, granted.getStatus());

        // Delete member
        securityService.deleteMember(aliceOwner, member.getId());
        assertTrue(householdMemberRepository.findById(member.getId()).isEmpty());

        // Audit log delete & clear
        List<AuditLog> logs = auditLogService.getAllLogs();
        assertFalse(logs.isEmpty());
        Long firstLogId = logs.get(0).getId();
        auditLogService.deleteLog(firstLogId);
        List<AuditLog> logsAfterDelete = auditLogService.getAllLogs();
        assertTrue(logsAfterDelete.stream().noneMatch(l -> l.getId().equals(firstLogId)));

        auditLogService.clearAll();
        assertTrue(auditLogService.getAllLogs().isEmpty());
    }
}
