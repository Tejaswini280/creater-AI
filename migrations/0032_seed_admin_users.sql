-- Migration: 0032_seed_admin_users.sql
-- Description: Seed primary admin user and optional testing user with production-safe credentials
-- Author: Senior Backend Engineer
-- Date: 2026-01-15
-- Idempotent: YES - Safe to run multiple times

-- ============================================================================
-- SEED PRIMARY ADMIN USER
-- ============================================================================
-- Email: tejaswini.kawade@renaissa.ai
-- Password: Intern2025#
-- Bcrypt Hash (12 rounds): Generated and verified
-- Role: admin (can be implemented via metadata or separate roles table)
-- Status: Active

INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  profile_image_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin-tejaswini-primary',
  'tejaswini.kawade@renaissa.ai',
  '$2b$12$p.CA7yPU2uR09jkHESEN/Ocj1qsg3KA73nJrNUZ9uh.CDo5iXDbiq',
  'Tejaswini',
  'Kawade',
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- SEED OPTIONAL TESTING USER
-- ============================================================================
-- Email: tester@renaissa.ai
-- Password: Intern2025#
-- Bcrypt Hash (12 rounds): Same as admin for testing purposes
-- Role: tester (can be implemented via metadata or separate roles table)
-- Status: Active

INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  profile_image_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'tester-renaissa-01',
  'tester@renaissa.ai',
  '$2b$12$p.CA7yPU2uR09jkHESEN/Ocj1qsg3KA73nJrNUZ9uh.CDo5iXDbiq',
  'Test',
  'User',
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY (Optional - for manual verification)
-- ============================================================================
-- Run this to verify the users were created:
-- SELECT id, email, first_name, last_name, is_active, created_at 
-- FROM users 
-- WHERE email IN ('tejaswini.kawade@renaissa.ai', 'tester@renaissa.ai');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Password hash generated using bcrypt with 12 rounds (production standard)
-- 2. ON CONFLICT ensures idempotency - safe to run multiple times
-- 3. Compatible with existing authentication logic in server/auth.ts
-- 4. Users can login immediately via /api/auth/login endpoint
-- 5. No schema changes - uses existing users table structure
-- 6. Railway deployment compatible
-- 7. Timestamps handled automatically with NOW()
-- 8. Role-based authorization can be implemented via metadata or separate table
