#!/usr/bin/env node

/**
 * Railway Staging Migration Dependencies Fix
 * Resolves circular dependencies and column reference issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Railway staging migration dependencies...');

// Create a clean, dependency-free core migration
const cleanCoreMigration = `-- 0001_core_tables_clean.sql
-- Clean core tables without problematic dependencies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (minimal, no problematic columns initially)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (minimal initially)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content table (minimal initially)
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content_text TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// Create column additions migration (separate from core tables)
const columnAdditionsMigration = `-- 0002_add_missing_columns.sql
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
`;

// Create essential tables migration
const essentialTablesMigration = `-- 0003_essential_tables.sql
-- Create essential tables that other migrations depend on

-- Content metrics table
CREATE TABLE IF NOT EXISTS content_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI generation tasks table
CREATE TABLE IF NOT EXISTS ai_generation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post schedules table
CREATE TABLE IF NOT EXISTS post_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    template_data JSONB,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hashtag suggestions table
CREATE TABLE IF NOT EXISTS hashtag_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashtag VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    popularity_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hashtag, platform)
);

-- AI engagement patterns table
CREATE TABLE IF NOT EXISTS ai_engagement_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    optimal_times TIME[],
    engagement_score DECIMAL(5,2) DEFAULT 0,
    sample_size INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, category)
);

-- Niches table
CREATE TABLE IF NOT EXISTS niches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    trend_score DECIMAL(5,2) DEFAULT 0,
    difficulty DECIMAL(5,2) DEFAULT 0,
    profitability DECIMAL(5,2) DEFAULT 0,
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_platform ON content_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_user_id ON ai_generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_tasks_status ON ai_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_post_schedules_scheduled_at ON post_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_post_schedules_platform ON post_schedules(platform);
CREATE INDEX IF NOT EXISTS idx_post_schedules_status ON post_schedules(status);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_featured ON templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_hashtag_suggestions_platform ON hashtag_suggestions(platform);
CREATE INDEX IF NOT EXISTS idx_hashtag_suggestions_category ON hashtag_suggestions(category);

-- Add update triggers
DROP TRIGGER IF EXISTS update_content_metrics_updated_at ON content_metrics;
CREATE TRIGGER update_content_metrics_updated_at BEFORE UPDATE ON content_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_generation_tasks_updated_at ON ai_generation_tasks;
CREATE TRIGGER update_ai_generation_tasks_updated_at BEFORE UPDATE ON ai_generation_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_schedules_updated_at ON post_schedules;
CREATE TRIGGER update_post_schedules_updated_at BEFORE UPDATE ON post_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hashtag_suggestions_updated_at ON hashtag_suggestions;
CREATE TRIGGER update_hashtag_suggestions_updated_at BEFORE UPDATE ON hashtag_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_engagement_patterns_updated_at ON ai_engagement_patterns;
CREATE TRIGGER update_ai_engagement_patterns_updated_at BEFORE UPDATE ON ai_engagement_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_niches_updated_at ON niches;
CREATE TRIGGER update_niches_updated_at BEFORE UPDATE ON niches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// Create seed data migration (safe)
const seedDataMigration = `-- 0004_seed_essential_data.sql
-- Seed essential data without conflicts

-- Insert AI engagement patterns (with conflict resolution)
INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size, metadata)
VALUES 
    ('instagram', 'lifestyle', ARRAY['09:00:00', '15:00:00', '19:00:00']::TIME[], 0.85, 1000, '{"peak_days": ["monday", "wednesday", "friday"]}'::JSONB),
    ('twitter', 'tech', ARRAY['08:00:00', '12:00:00', '17:00:00']::TIME[], 0.82, 800, '{"peak_days": ["tuesday", "thursday"]}'::JSONB),
    ('linkedin', 'business', ARRAY['07:00:00', '12:00:00', '16:00:00']::TIME[], 0.88, 1200, '{"peak_days": ["tuesday", "wednesday", "thursday"]}'::JSONB),
    ('facebook', 'entertainment', ARRAY['10:00:00', '14:00:00', '20:00:00']::TIME[], 0.79, 900, '{"peak_days": ["friday", "saturday", "sunday"]}'::JSONB),
    ('youtube', 'education', ARRAY['16:00:00', '19:00:00', '21:00:00']::TIME[], 0.90, 1500, '{"peak_days": ["saturday", "sunday"]}'::JSONB),
    ('tiktok', 'dance', ARRAY['18:00:00', '20:00:00', '22:00:00']::TIME[], 0.87, 2000, '{"peak_days": ["friday", "saturday", "sunday"]}'::JSONB)
ON CONFLICT (platform, category) DO UPDATE SET
    optimal_times = EXCLUDED.optimal_times,
    engagement_score = EXCLUDED.engagement_score,
    sample_size = EXCLUDED.sample_size,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

-- Insert content templates (with conflict resolution)
INSERT INTO templates (name, description, category, template_data, is_featured)
VALUES 
    ('Social Media Post', 'Basic social media post template', 'social', '{"structure": "hook-content-cta", "length": "short"}'::JSONB, true),
    ('Blog Article', 'Long-form blog article template', 'blog', '{"structure": "intro-body-conclusion", "length": "long"}'::JSONB, true),
    ('Product Launch', 'Product announcement template', 'marketing', '{"structure": "problem-solution-benefits", "length": "medium"}'::JSONB, false),
    ('Educational Content', 'How-to and tutorial template', 'education', '{"structure": "overview-steps-summary", "length": "medium"}'::JSONB, true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    template_data = EXCLUDED.template_data,
    is_featured = EXCLUDED.is_featured,
    updated_at = NOW();

-- Insert hashtag suggestions (with conflict resolution)
INSERT INTO hashtag_suggestions (hashtag, platform, category, popularity_score)
VALUES 
    ('#socialmedia', 'instagram', 'marketing', 4.8),
    ('#contentcreator', 'instagram', 'lifestyle', 4.7),
    ('#digitalmarketing', 'linkedin', 'business', 4.9),
    ('#tech', 'twitter', 'technology', 4.6),
    ('#startup', 'linkedin', 'business', 4.5),
    ('#ai', 'twitter', 'technology', 4.8),
    ('#marketing', 'facebook', 'business', 4.7),
    ('#content', 'instagram', 'lifestyle', 4.4)
ON CONFLICT (hashtag, platform) DO UPDATE SET
    category = EXCLUDED.category,
    popularity_score = EXCLUDED.popularity_score,
    updated_at = NOW();

-- Insert sample niches (with conflict resolution)
INSERT INTO niches (name, description, trend_score, difficulty, profitability, keywords)
VALUES 
    ('Sustainable Living', 'Eco-friendly lifestyle and products', 0.85, 0.6, 0.7, ARRAY['sustainability', 'eco-friendly', 'green-living']),
    ('Digital Marketing', 'Online marketing strategies and tools', 0.92, 0.8, 0.9, ARRAY['seo', 'social-media', 'content-marketing']),
    ('Personal Finance', 'Money management and investment advice', 0.88, 0.7, 0.85, ARRAY['budgeting', 'investing', 'financial-planning'])
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    trend_score = EXCLUDED.trend_score,
    difficulty = EXCLUDED.difficulty,
    profitability = EXCLUDED.profitability,
    keywords = EXCLUDED.keywords,
    updated_at = NOW();
`;

try {
    // Write the clean migrations
    fs.writeFileSync('migrations/0001_core_tables_clean.sql', cleanCoreMigration);
    fs.writeFileSync('migrations/0002_add_missing_columns.sql', columnAdditionsMigration);
    fs.writeFileSync('migrations/0003_essential_tables.sql', essentialTablesMigration);
    fs.writeFileSync('migrations/0004_seed_essential_data.sql', seedDataMigration);

    console.log('✅ Created clean migration files');

    // Create a migration order file
    const migrationOrder = `# Railway Staging Migration Order
# Execute in this exact order to avoid dependency issues

1. 0001_core_tables_clean.sql
2. 0002_add_missing_columns.sql  
3. 0003_essential_tables.sql
4. 0004_seed_essential_data.sql

# Skip all other migrations that have dependency issues
# These 4 migrations provide a clean, working database schema
`;

    fs.writeFileSync('RAILWAY_STAGING_MIGRATION_ORDER.md', migrationOrder);

    console.log('✅ Created migration order guide');
    console.log('🎯 Railway staging migration dependencies fixed!');
    console.log('📋 Next steps:');
    console.log('1. Deploy only the 4 clean migration files');
    console.log('2. Skip problematic migrations with circular dependencies');
    console.log('3. Test the application with the clean schema');

} catch (error) {
    console.error('❌ Error fixing migrations:', error);
    process.exit(1);
}