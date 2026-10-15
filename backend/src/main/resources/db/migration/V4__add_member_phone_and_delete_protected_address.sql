-- V4__add_member_phone_and_delete_protected_address.sql
-- Add member_phone to trusted_household_members and make member_email/relationship optional

ALTER TABLE trusted_household_members ADD COLUMN IF NOT EXISTS member_phone VARCHAR(50);
ALTER TABLE trusted_household_members ALTER COLUMN member_email DROP NOT NULL;
ALTER TABLE trusted_household_members ALTER COLUMN relationship DROP NOT NULL;

-- Seed Bob's mobile number
UPDATE trusted_household_members SET member_phone = '+1 555-0144' WHERE id = 201;
