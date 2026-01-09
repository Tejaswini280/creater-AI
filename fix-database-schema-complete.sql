-- Complete Database Schema Fix
-- This script will fix all missing columns and schema issues

-- Fix users table - add missing password column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password') THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
        UPDATE users SET password = '$2b$10$defaulthashedpassword' WHERE password IS NULL;
    END IF;
END $$;

-- Fix scheduled_content table - add missing project_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scheduled_content' AND column_name = 'project_id') THEN
        ALTER TABLE scheduled_content ADD COLUMN project_id INTEGER;
    END IF;
END $$;

-- Ensure all required tables exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled_content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    platform VARCHAR(50),
    scheduled_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_user_id ON scheduled_content(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_project_id ON scheduled_content(project_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_at ON scheduled_content(scheduled_at);

-- Insert a default test user if none exists
INSERT INTO users (email, password, name) 
SELECT 'test@example.com', '$2b$10$defaulthashedpassword', 'Test User'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com');

COMMIT;