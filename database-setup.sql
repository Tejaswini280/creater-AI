-- CreatorNexus Database Setup
-- Run this script in your PostgreSQL database

-- Create database if it doesn't exist
CREATE DATABASE creators_dev_db;

-- Create user if it doesn't exist
CREATE USER creators_dev_user WITH PASSWORD 'CreatorsDev54321';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE creators_dev_db TO creators_dev_user;
GRANT ALL ON SCHEMA public TO creators_dev_user;

-- Connect to the database
\c creators_dev_db;

-- Grant schema privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO creators_dev_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO creators_dev_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO creators_dev_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO creators_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO creators_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO creators_dev_user;
