-- V3__add_phone_and_otp.sql: Add phone number and OTP workflow to protected addresses and authorization requests

ALTER TABLE protected_addresses ADD COLUMN phone VARCHAR(50);

ALTER TABLE authorization_requests ADD COLUMN otp_code VARCHAR(10);
ALTER TABLE authorization_requests ADD COLUMN otp_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE authorization_requests ADD COLUMN owner_phone VARCHAR(50);
ALTER TABLE authorization_requests ADD COLUMN otp_verified BOOLEAN DEFAULT FALSE;

-- Seed Dhevesh (Address Owner) and Ajay (Customer)
INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES
(10, 'dhevesh@shield.com', '$2a$10$GsJupfqjZV3ieTlZzYgWueXOpCkkCaEuTl9H3GqnsHEKm21Wx.uji', 'Dhevesh', '+91 9876543210', 'ROLE_CUSTOMER'),
(11, 'ajay@shield.com', '$2a$10$GsJupfqjZV3ieTlZzYgWueXOpCkkCaEuTl9H3GqnsHEKm21Wx.uji', 'Ajay', '+91 9876500000', 'ROLE_CUSTOMER');

-- Update Alice's address phone and seed Dhevesh's Protected Address
UPDATE protected_addresses SET phone = '+1 555-0199' WHERE id = 101;

INSERT INTO protected_addresses (id, owner_id, label, street_line, unit, city, state, postal_code, country, phone, normalized_hash, verification_status, is_active)
VALUES (102, 10, 'Dhevesh Home (Lotus Residency)', '42 Lotus Residency, Gandhi Road', 'Villa 12', 'Chennai', 'TN', '600001', 'India', '+91 9876543210', '42lotusresidencygandhird|villa12|chennai|600001', 'VERIFIED', TRUE);

