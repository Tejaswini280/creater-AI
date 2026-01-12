-- 0002_add_missing_columns.sql
-- Add missing columns referenced in other migrations

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_frequency VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS channel_types TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_voice TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_formats TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_themes TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_length VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS posting_frequency VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_tools TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS scheduling_preferences JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_members TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goals TEXT[];

-- Add missing columns to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE content ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE content ADD COLUMN IF NOT EXISTS day_number INTEGER;
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE content ADD COLUMN IF NOT EXISTS engagement_prediction DECIMAL(5,2);
ALTER TABLE content ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS optimal_posting_time TIME;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_day_number ON content(day_number);
CREATE INDEX IF NOT EXISTS idx_content_content_status ON content(content_status);
