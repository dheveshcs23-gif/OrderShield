-- V4__replace_alice_with_dhevesh.sql: Update any remaining Alice references to Dhevesh
UPDATE users 
SET full_name = 'Dhevesh', 
    email = 'dhevesh@shield.com', 
    phone = '+91 9876543210' 
WHERE id = 1 OR email = 'alice@shield.com';

UPDATE users 
SET full_name = 'Ajay', 
    email = 'ajay@shield.com', 
    phone = '+91 9876500000' 
WHERE id = 2 OR email = 'bob@shield.com';

UPDATE users 
SET full_name = 'Guest Buyer', 
    email = 'buyer@shield.com' 
WHERE id = 3 OR email = 'mallory@shield.com';

UPDATE protected_addresses 
SET label = 'Primary Residence (Lotus Residency)',
    street_line = '42 Lotus Residency, Gandhi Road',
    unit = 'Villa 12',
    city = 'Chennai',
    state = 'TN',
    postal_code = '600001',
    country = 'India',
    phone = '+91 9876543210',
    normalized_hash = '42lotusresidencygandhird|villa12|chennai|600001'
WHERE id = 101;
