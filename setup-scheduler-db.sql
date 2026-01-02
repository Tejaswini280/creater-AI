-- Simple database setup for scheduler functionality
-- This script creates only the essential tables needed for content scheduling

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    password_hash VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create content table with correct schema for scheduler
CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER, -- Optional, can be NULL
    title VARCHAR NOT NULL,
    description TEXT,
    script TEXT,
    platform VARCHAR NOT NULL,
    content_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    thumbnail_url VARCHAR,
    video_url VARCHAR,
    tags TEXT[],
    metadata JSONB,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Insert a test user if it doesn't exist
INSERT INTO users (id, email, first_name, last_name) 
VALUES ('test-user-id', 'test@example.com', 'Test', 'User')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
