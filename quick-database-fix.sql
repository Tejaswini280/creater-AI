-- Quick Database Schema Fix for Railway
-- Run this SQL directly in your Railway database console

-- 1. Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR NOT NULL,
    template VARCHAR,
    platform VARCHAR,
    target_audience VARCHAR,
    estimated_duration VARCHAR,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    status VARCHAR NOT NULL DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add project_id column to content table
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- 3. Add foreign key constraint
ALTER TABLE content 
ADD CONSTRAINT IF NOT EXISTS fk_content_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 4. Create content_metrics table
CREATE TABLE IF NOT EXISTS content_metrics (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    platform VARCHAR NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    revenue DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 5. Create ai_generation_tasks table
CREATE TABLE IF NOT EXISTS ai_generation_tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR NOT NULL,
    prompt TEXT NOT NULL,
    result TEXT,
    status VARCHAR NOT NULL DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 6. Add missing columns to content table
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS day_number INTEGER,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_content_day_number ON content(day_number);
CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON ai_generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Verification queries
SELECT 'Projects table created' as status, COUNT(*) as count FROM projects;
SELECT 'Content metrics table created' as status, COUNT(*) as count FROM content_metrics;
SELECT 'AI tasks table created' as status, COUNT(*) as count FROM ai_generation_tasks;

-- Check if project_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'content' AND column_name = 'project_id';