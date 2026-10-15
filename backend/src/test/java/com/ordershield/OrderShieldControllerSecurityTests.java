package com.ordershield;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ordershield.config.JwtTokenProvider;
import com.ordershield.dto.OrderCreateRequest;
import com.ordershield.dto.OrderItemRequest;
import com.ordershield.dto.ShippingAddressDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderShieldControllerSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Test
    @DisplayName("Scenario L: Admin endpoint /api/admin/orders is rejected with 403 for customer account")
    void testCustomerCannotAccessAdminEndpoint() throws Exception {
        String customerToken = tokenProvider.generateTokenForEmail("alice@shield.com", "ROLE_CUSTOMER");

        mockMvc.perform(get("/api/admin/orders")
                .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario L: Admin endpoint /api/admin/orders is permitted for admin account")
    void testAdminCanAccessAdminEndpoint() throws Exception {
        String adminToken = tokenProvider.generateTokenForEmail("admin@ordershield.com", "ROLE_ADMIN");

        mockMvc.perform(get("/api/admin/orders")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Scenario J: Missing required fields and empty items returns 400 Bad Request")
    void testOrderValidationFailureOnMissingFields() throws Exception {
        String customerToken = tokenProvider.generateTokenForEmail("alice@shield.com", "ROLE_CUSTOMER");

        // Order with null shipping address and empty items
        OrderCreateRequest invalidRequest = new OrderCreateRequest(null, List.of());

        mockMvc.perform(post("/api/orders")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @DisplayName("Scenario J: Negative or zero quantity is rejected by Bean Validation")
    void testInvalidItemQuantityValidation() throws Exception {
        String customerToken = tokenProvider.generateTokenForEmail("alice@shield.com", "ROLE_CUSTOMER");

        ShippingAddressDto validAddress = new ShippingAddressDto(
                "Jane Doe", "123 Test St", "Apt 1", "City", "State", "12345", "USA", "555-1234"
        );
        OrderCreateRequest invalidQtyRequest = new OrderCreateRequest(
                validAddress,
                List.of(new OrderItemRequest(1L, 0)) // 0 quantity violates @Min(1)
        );

        mockMvc.perform(post("/api/orders")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidQtyRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Scenario H: Unauthenticated request to protected endpoints is rejected with 403/401")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/orders/my"))
                .andExpect(status().isForbidden());
    }
}
