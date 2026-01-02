-- Migration: Enhance database integrity and performance
-- Date: 2024-12-19
-- Description: Adds additional constraints, indexes, and data validation rules

-- Enhanced content table constraints
ALTER TABLE content
ADD CONSTRAINT chk_content_platform CHECK (platform IN ('youtube', 'linkedin', 'instagram', 'tiktok', 'twitter', 'facebook'));

-- Enhanced social accounts constraints
ALTER TABLE social_accounts
ADD CONSTRAINT chk_social_platform CHECK (platform IN ('youtube', 'linkedin', 'instagram', 'tiktok', 'twitter', 'facebook'));

-- Add length constraints for text fields
ALTER TABLE content
ADD CONSTRAINT chk_title_length CHECK (length(title) >= 1 AND length(title) <= 100);

ALTER TABLE content
ADD CONSTRAINT chk_description_length CHECK (length(description) <= 2000);

ALTER TABLE projects
ADD CONSTRAINT chk_project_name_length CHECK (length(name) >= 1 AND length(name) <= 100);

-- Add JSON validation for metadata fields
ALTER TABLE content
ADD CONSTRAINT chk_metadata_json CHECK (jsonb_typeof(metadata) = 'object');

ALTER TABLE projects
ADD CONSTRAINT chk_project_metadata_json CHECK (jsonb_typeof(metadata) = 'object');

-- Performance indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_user_created ON content(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_platform_status ON content(platform, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- Add partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_scheduled_future ON content(scheduled_at)
WHERE scheduled_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_scheduled_future ON social_posts(scheduled_at)
WHERE scheduled_at > NOW();

-- Add foreign key indexes for better join performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_project_id ON content(project_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_project_id ON social_posts(project_id);

-- Add unique constraints where appropriate
ALTER TABLE social_accounts
ADD CONSTRAINT unique_user_platform_account UNIQUE(user_id, platform, account_id);

-- Add not null constraints for critical fields
ALTER TABLE content ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE content ALTER COLUMN platform SET NOT NULL;
ALTER TABLE content ALTER COLUMN content_type SET NOT NULL;
ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN name SET NOT NULL;
ALTER TABLE projects ALTER COLUMN type SET NOT NULL;

-- Add default values for status fields
ALTER TABLE content ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'active';

-- Add comments for documentation
COMMENT ON COLUMN content.metadata IS 'Additional metadata in JSON format for extensibility';
COMMENT ON COLUMN projects.metadata IS 'Project-specific configuration and settings';
COMMENT ON COLUMN users.profile_image_url IS 'URL to user profile image stored in cloud storage';
COMMENT ON COLUMN content.thumbnail_url IS 'URL to content thumbnail image';
COMMENT ON COLUMN content.video_url IS 'URL to video file stored in cloud storage';

-- Add trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add data validation functions
CREATE OR REPLACE FUNCTION validate_email_format(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Add check constraint using the validation function
ALTER TABLE users
ADD CONSTRAINT chk_email_format CHECK (validate_email_format(email));

-- Add function to validate future dates
CREATE OR REPLACE FUNCTION is_future_date(target_date TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN target_date IS NULL OR target_date > NOW();
END;
$$ LANGUAGE plpgsql;

-- Update existing constraints to use the validation function
ALTER TABLE content DROP CONSTRAINT IF EXISTS chk_scheduled_future;
ALTER TABLE content ADD CONSTRAINT chk_scheduled_future CHECK (is_future_date(scheduled_at));

ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS chk_scheduled_future_social;
ALTER TABLE social_posts ADD CONSTRAINT chk_scheduled_future_social CHECK (is_future_date(scheduled_at));
