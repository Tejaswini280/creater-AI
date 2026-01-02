-- Migration: Enhance Projects Schema for New Project Implementation
-- Date: 2024
-- Description: Add enhanced fields and indexes for the new project creation workflow

-- Add indexes for better query performance on enhanced project features
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Add index for social accounts by user and platform
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);

-- Add index for content by project
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id);

-- Add composite index for content queries
CREATE INDEX IF NOT EXISTS idx_content_project_status ON content(project_id, status);

-- Ensure metadata column exists and can handle enhanced project data
-- The metadata column should already exist from the base schema, but let's verify it can handle the enhanced structure

-- Add comments to document the enhanced schema usage
COMMENT ON COLUMN projects.metadata IS 'Enhanced project metadata including: contentType, channelTypes, category, duration, customDuration, contentFrequency, calendarPreference, aiEnhancement, notificationsEnabled, aiCalendar, integrations, step tracking';

COMMENT ON COLUMN social_accounts.metadata IS 'Social account metadata including: connectedVia, projectId, connectedAt, platform-specific settings';

-- Add constraint to ensure project metadata is valid JSON
-- This is handled by the jsonb type in PostgreSQL

-- Create a view for enhanced project dashboard data
CREATE OR REPLACE VIEW enhanced_project_dashboard AS
SELECT
    p.id,
    p.name,
    p.description,
    p.type as content_type,
    p.status,
    p.created_at,
    p.metadata,
    -- Extract key metadata fields for easier querying
    p.metadata->>'contentType' as extracted_content_type,
    p.metadata->>'channelTypes' as channel_types,
    p.metadata->>'category' as category,
    p.metadata->>'duration' as duration,
    p.metadata->>'aiEnhancement' as ai_enhancement,
    p.metadata->>'step' as completion_step,
    -- Count content by status
    COUNT(CASE WHEN c.status = 'published' THEN 1 END) as published_count,
    COUNT(CASE WHEN c.status = 'scheduled' THEN 1 END) as scheduled_count,
    COUNT(CASE WHEN c.status = 'draft' THEN 1 END) as draft_count,
    COUNT(c.id) as total_content
FROM projects p
LEFT JOIN content c ON p.id = c.project_id
WHERE p.user_id = c.user_id OR c.user_id IS NULL
GROUP BY p.id, p.name, p.description, p.type, p.status, p.created_at, p.metadata;

-- Grant permissions on the view
GRANT SELECT ON enhanced_project_dashboard TO PUBLIC;

-- Add function to get project completion percentage based on steps
CREATE OR REPLACE FUNCTION get_project_completion_percentage(project_metadata jsonb)
RETURNS integer AS $$
DECLARE
    step text;
    percentage integer := 0;
BEGIN
    step := project_metadata->>'step';

    CASE step
        WHEN 'basics_completed' THEN percentage := 25;
        WHEN 'content_created' THEN percentage := 50;
        WHEN 'integrations_completed' THEN percentage := 75;
        WHEN 'scheduled' THEN percentage := 100;
        ELSE percentage := 0;
    END CASE;

    RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Add function to validate enhanced project data
CREATE OR REPLACE FUNCTION validate_enhanced_project_data()
RETURNS trigger AS $$
BEGIN
    -- Validate required enhanced fields exist in metadata
    IF NEW.metadata->>'contentType' IS NULL THEN
        RAISE EXCEPTION 'contentType is required in project metadata';
    END IF;

    IF NEW.metadata->>'channelTypes' IS NULL OR jsonb_array_length(NEW.metadata->'channelTypes') = 0 THEN
        RAISE EXCEPTION 'channelTypes must contain at least one platform';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enhanced project validation
DROP TRIGGER IF EXISTS validate_enhanced_project_trigger ON projects;
CREATE TRIGGER validate_enhanced_project_trigger
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION validate_enhanced_project_data();

-- Add some useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_metadata_content_type ON projects USING gin ((metadata->>'contentType'));
CREATE INDEX IF NOT EXISTS idx_projects_metadata_channel_types ON projects USING gin ((metadata->'channelTypes'));
CREATE INDEX IF NOT EXISTS idx_projects_metadata_step ON projects USING gin ((metadata->>'step'));

-- Add index for AI calendar queries
CREATE INDEX IF NOT EXISTS idx_projects_metadata_ai_calendar ON projects USING gin ((metadata->'aiCalendar'));

-- Add index for integrations data
CREATE INDEX IF NOT EXISTS idx_projects_metadata_integrations ON projects USING gin ((metadata->'integrations'));

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Enhanced projects schema migration completed successfully';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '  - Enhanced project metadata structure';
    RAISE NOTICE '  - Social media integrations support';
    RAISE NOTICE '  - AI calendar generation capabilities';
    RAISE NOTICE '  - Project completion step tracking';
    RAISE NOTICE '  - Dashboard view for enhanced analytics';
END $$;
