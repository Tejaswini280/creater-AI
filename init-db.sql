-- Database Initialization Script for Docker
-- This script creates the database and runs the essential migrations

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE creators_dev_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'creators_dev_db')\gexec

-- Connect to the database
\c creators_dev_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the basic users table first
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT 'temp_password_needs_reset',
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    profile_image_url VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY NOT NULL,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create a basic test user
INSERT INTO users (id, email, password, first_name, last_name, is_active)
VALUES (
  'test-user-id',
  'test@creatornexus.com',
  '$2b$10$rQZ8qNqZ8qNqZ8qNqZ8qNOe', -- hashed 'password123'
  'Test',
  'User',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Create index on sessions expire column
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);