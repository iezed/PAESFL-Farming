-- Migration: Add email verification support
-- This migration adds email_verified field and email_verification_token to users table

-- Add email_verified column (default false for new users, true for existing users for backward compatibility)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add email_verification_token column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);

-- Add token expiration timestamp
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP;

-- Set existing users as verified (for backward compatibility)
-- Note: Since we set DEFAULT false, we need to update all existing users
UPDATE users SET email_verified = true WHERE email_verified = false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
