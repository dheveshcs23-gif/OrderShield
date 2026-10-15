-- V2__seed_initial_data.sql: Realistic Seed Data for OrderShield

-- Seed Demo Users (BCrypt hash for "password123")
INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES
(1, 'alice@shield.com', '$2a$10$GsJupfqjZV3ieTlZzYgWueXOpCkkCaEuTl9H3GqnsHEKm21Wx.uji', 'Alice Walker (Address Owner)', '+1 555-0199', 'ROLE_CUSTOMER'),
(2, 'bob@shield.com', '$2a$10$GsJupfqjZV3ieTlZzYgWueXOpCkkCaEuTl9H3GqnsHEKm21Wx.uji', 'Bob Walker (Trusted Member)', '+1 555-0144', 'ROLE_CUSTOMER'),
(3, 'mallory@shield.com', '$2a$10$GsJupfqjZV3ieTlZzYgWueXOpCkkCaEuTl9H3GqnsHEKm21Wx.uji', 'Mallory Smith (Stranger)', '+1 555-0188', 'ROLE_CUSTOMER'),
(99, 'admin@ordershield.com', '$2a$10$GsJupfqjZV3ieTlZzYgWueXOpCkkCaEuTl9H3GqnsHEKm21Wx.uji', 'Chief Security Officer', '+1 555-0100', 'ROLE_ADMIN');

-- Seed Categories
INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Home Security', 'home-security', 'Smart cameras, sensors, and verified access alarms'),
(2, 'Smart Home & IoT', 'smart-home', 'Intelligent automation for everyday peace of mind'),
(3, 'Personal Audio', 'personal-audio', 'Noise-cancelling headphones and lossless audio gear'),
(4, 'Computing & Office', 'computing', 'High-performance laptops, monitors, and secure peripherals');

-- Seed Products
INSERT INTO products (id, category_id, sku, name, slug, description, price, stock_quantity, image_url, rating, review_count, is_featured) VALUES
(1, 1, 'SEC-CAM-4K-01', 'ShieldGuard Ultra 4K Security Camera', 'shieldguard-ultra-4k-camera', 'AI-powered 4K HDR home security camera with encrypted local storage, full-color night vision, and tamper detection.', 14999.00, 42, '/products/camera.jpg', 4.9, 128, TRUE),
(2, 1, 'SEC-LOCK-BIO-02', 'SecureDoor Pro Biometric Smart Lock', 'securedoor-pro-biometric-lock', 'Sub-second fingerprint recognition, backlit touchscreen keypad, physical key override, and remote smartphone lockdown.', 18499.00, 28, '/products/smartlock.jpg', 4.8, 94, TRUE),
(3, 3, 'AUD-ANC-HP-03', 'AcousticPure Active Noise Cancelling Headphones', 'acousticpure-anc-headphones', 'Studio-grade acoustic drivers with 40-hour battery life, titanium diaphragm, and multipoint Bluetooth 5.4 connection.', 8999.00, 15, '/products/headphones.jpg', 4.7, 215, TRUE),
(4, 2, 'IOT-HUB-DISP-04', 'ShieldHub Max Smart Display & Gateway', 'shieldhub-max-smart-display', '10-inch HD central command screen for all your smart devices, with physical camera privacy shutter and stereo speakers.', 11999.00, 35, '/products/smartdisplay.jpg', 4.6, 82, TRUE),
(5, 4, 'CMP-KB-MECH-05', 'Vantage Pro Mechanical Wireless Keyboard', 'vantage-pro-wireless-keyboard', 'Hot-swappable tactile switches, aircraft-grade aluminum frame, PBT keycaps, and multi-device 2.4GHz / BT connection.', 6499.00, 50, '/products/keyboard.jpg', 4.9, 164, TRUE),
(6, 1, 'SEC-SNS-MOT-06', 'OmniSense Motion & Glass-Break Sensor Pack', 'omnisense-motion-sensor-pack', 'Pack of 4 ultra-sensitive millimeter-wave motion sensors with pet-immunity and 5-year battery life.', 3999.00, 60, '/products/sensor.jpg', 4.8, 77, FALSE),
(7, 3, 'AUD-TWS-07', 'QuantumSound True Wireless Earbuds', 'quantumsound-wireless-earbuds', 'IPX7 waterproof wireless earbuds with active ambient mode, wireless charging case, and crystal-clear voice microphones.', 2999.00, 75, '/products/earbuds.jpg', 4.5, 140, TRUE),
(8, 4, 'CMP-LAP-AERO-08', 'AeroBook Pro 15.6" Ultra-Thin Laptop', 'aerobook-pro-laptop', 'Intel Core Ultra 7 processor, 32GB RAM, 1TB NVMe SSD, hardware TPM 2.0 cryptographic security, and 2.8K OLED display.', 84999.00, 10, '/products/laptop.jpg', 4.9, 68, TRUE),
(9, 1, 'SEC-CAM-PTZ-09', 'GuardianEye 360° PTZ Outdoor Security Camera', 'guardianeye-360-ptz-camera', 'Dual-lens pan-tilt outdoor surveillance camera with 360° coverage, spotlight auto-tracking, and two-way siren deterrence.', 7499.00, 34, '/products/ptz_camera.jpg', 4.7, 92, TRUE),
(10, 4, 'CMP-SEC-KEY-10', 'CyberVault Hardware Cryptographic FIDO2 Key', 'cybervault-fido2-security-key', 'Military-grade hardware authenticator with NFC and USB-C. Protects logins with phishing-resistant FIDO2/WebAuthn tokens.', 3499.00, 88, '/products/securitykey.jpg', 4.9, 153, FALSE),
(11, 2, 'IOT-RTR-WF7-11', 'SecureBeam Dual-Band WiFi 7 Mesh Router', 'securebeam-wifi7-mesh-router', 'Ultra-fast 9.6 Gbps tri-band WiFi 7 system with built-in hardware firewall, VPN encryption, and guest network isolation.', 16999.00, 22, '/products/router.jpg', 4.8, 64, TRUE),
(12, 1, 'SEC-SNS-SMK-12', 'SafeHaven Smart Smoke & Gas Hazard Detector', 'safehaven-smart-smoke-detector', 'Photoelectric smoke sensor and electrochemical carbon monoxide detector with instant phone push notifications and 85dB alarm.', 3299.00, 45, '/products/smokedetector.jpg', 4.6, 51, FALSE);

-- Seed Alice's Protected Address (Evergreen Terrace)
-- Normalized: 742evergreenterrace|apt4b|springfield|97477
INSERT INTO protected_addresses (id, owner_id, label, street_line, unit, city, state, postal_code, country, normalized_hash, verification_status, is_active)
VALUES (101, 1, 'Primary Residence (Evergreen House)', '742 Evergreen Terrace', 'Apt 4B', 'Springfield', 'OR', '97477', 'United States', '742evergreenterrace|apt4b|springfield|97477', 'VERIFIED', TRUE);

-- Seed Alice's Trusted Household Member (Bob)
INSERT INTO trusted_household_members (id, protected_address_id, member_user_id, member_email, member_name, relationship, status)
VALUES (201, 101, 2, 'bob@shield.com', 'Bob Walker', 'Brother / Household Resident', 'ACTIVE');

-- Set identity auto-increment counters past seeded keys
ALTER TABLE users ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE categories ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE products ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE addresses ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE protected_addresses ALTER COLUMN id RESTART WITH 1000;
ALTER TABLE trusted_household_members ALTER COLUMN id RESTART WITH 1000;
