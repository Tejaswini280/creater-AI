-- Enhanced Content Management Migration
-- Add new columns and constraints for content lifecycle management

-- Add new columns to content table for enhanced content management
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS day_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS content_status VARCHAR(20) DEFAULT 'draft' CHECK (content_status IN ('draft', 'scheduled', 'published', 'paused', 'deleted')),
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS engagement_prediction JSONB,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(100),
ADD COLUMN IF NOT EXISTS optimal_posting_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS content_metadata JSONB;

-- Update existing content records to have proper status
UPDATE content 
SET content_status = CASE 
  WHEN status = 'draft' THEN 'draft'
  WHEN status = 'scheduled' THEN 'scheduled'
  WHEN status = 'published' THEN 'published'
  WHEN status = 'paused' THEN 'paused'
  WHEN status = 'deleted' THEN 'deleted'
  ELSE 'draft'
END
WHERE content_status IS NULL;

-- Create index for better performance on content queries
CREATE INDEX IF NOT EXISTS idx_content_project_status ON content(project_id, content_status);
CREATE INDEX IF NOT EXISTS idx_content_day_number ON content(project_id, day_number);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_time ON content(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_content_platform ON content(platform);

-- Create content_actions table to track content lifecycle events
CREATE TABLE IF NOT EXISTS content_actions (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'created', 'edited', 'scheduled', 'published', 'paused', 'stopped', 'deleted', 'regenerated', 'recreated'
  action_data JSONB,
  performed_by VARCHAR NOT NULL, -- user_id
  performed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Create index for content actions
CREATE INDEX IF NOT EXISTS idx_content_actions_content_id ON content_actions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_actions_type ON content_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_content_actions_performed_at ON content_actions(performed_at);

-- Create content_versions table for content versioning
CREATE TABLE IF NOT EXISTS content_versions (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  script TEXT,
  hashtags TEXT[],
  scheduled_time TIMESTAMP,
  content_status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR NOT NULL
);

-- Create index for content versions
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_version ON content_versions(content_id, version_number);

-- Create project_extensions table to track project duration extensions
CREATE TABLE IF NOT EXISTS project_extensions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_duration INTEGER NOT NULL, -- in days
  extended_duration INTEGER NOT NULL, -- in days
  extension_days INTEGER NOT NULL, -- how many days were added
  extended_at TIMESTAMP DEFAULT NOW(),
  extended_by VARCHAR NOT NULL,
  metadata JSONB
);

-- Create index for project extensions
CREATE INDEX IF NOT EXISTS idx_project_extensions_project_id ON project_extensions(project_id);

-- Add trigger to automatically create content actions
CREATE OR REPLACE FUNCTION create_content_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_actions (content_id, action_type, performed_by, action_data)
  VALUES (
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'edited'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    COALESCE(NEW.user_id, OLD.user_id),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'old_status', OLD.content_status,
        'new_status', NEW.content_status,
        'old_title', OLD.title,
        'new_title', NEW.title
      )
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for content table
DROP TRIGGER IF EXISTS content_action_trigger ON content;
CREATE TRIGGER content_action_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content
  FOR EACH ROW EXECUTE FUNCTION create_content_action();

-- Add function to get content statistics for a project
CREATE OR REPLACE FUNCTION get_project_content_stats(project_id_param INTEGER)
RETURNS TABLE (
  total_content INTEGER,
  draft_count INTEGER,
  scheduled_count INTEGER,
  published_count INTEGER,
  paused_count INTEGER,
  deleted_count INTEGER,
  total_days INTEGER,
  avg_engagement DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_content,
    COUNT(*) FILTER (WHERE content_status = 'draft')::INTEGER as draft_count,
    COUNT(*) FILTER (WHERE content_status = 'scheduled')::INTEGER as scheduled_count,
    COUNT(*) FILTER (WHERE content_status = 'published')::INTEGER as published_count,
    COUNT(*) FILTER (WHERE content_status = 'paused')::INTEGER as paused_count,
    COUNT(*) FILTER (WHERE content_status = 'deleted')::INTEGER as deleted_count,
    COALESCE(MAX(day_number), 0)::INTEGER as total_days,
    COALESCE(AVG((engagement_prediction->>'average')::DECIMAL), 0) as avg_engagement
  FROM content 
  WHERE content.project_id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add function to extend project and generate new content
CREATE OR REPLACE FUNCTION extend_project_content(
  project_id_param INTEGER,
  extension_days INTEGER,
  user_id_param VARCHAR
)
RETURNS TABLE (
  new_content_id INTEGER,
  day_number INTEGER
) AS $$
DECLARE
  project_record RECORD;
  current_day INTEGER;
  new_content_id INTEGER;
BEGIN
  -- Get project details
  SELECT * INTO project_record FROM projects WHERE id = project_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Get current max day number
  SELECT COALESCE(MAX(day_number), 0) INTO current_day 
  FROM content 
  WHERE project_id = project_id_param;
  
  -- Record the extension
  INSERT INTO project_extensions (project_id, original_duration, extended_duration, extension_days, extended_by)
  VALUES (project_id_param, current_day, current_day + extension_days, extension_days, user_id_param);
  
  -- Generate new content for extended days (this would typically call AI service)
  -- For now, we'll create placeholder content
  FOR i IN 1..extension_days LOOP
    INSERT INTO content (
      user_id, project_id, title, description, platform, content_type, 
      content_status, day_number, is_ai_generated, created_at, updated_at
    ) VALUES (
      user_id_param, project_id_param, 
      'Generated Content - Day ' || (current_day + i),
      'AI-generated content for day ' || (current_day + i),
      project_record.platform,
      'post',
      'draft',
      current_day + i,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO new_content_id;
    
    RETURN QUERY SELECT new_content_id, current_day + i;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing content to have proper day numbers if they don't have them
UPDATE content 
SET day_number = 1 
WHERE day_number IS NULL;

-- Add comments for documentation
COMMENT ON TABLE content_actions IS 'Tracks all actions performed on content items for audit and analytics';
COMMENT ON TABLE content_versions IS 'Stores version history of content items for rollback capabilities';
COMMENT ON TABLE project_extensions IS 'Tracks when projects are extended with additional content days';
COMMENT ON COLUMN content.day_number IS 'The day number within the project (1, 2, 3, etc.)';
COMMENT ON COLUMN content.content_status IS 'Current status of the content in the publishing lifecycle';
COMMENT ON COLUMN content.engagement_prediction IS 'AI-predicted engagement metrics for the content';
COMMENT ON COLUMN content.target_audience IS 'Target audience for the content';
COMMENT ON COLUMN content.optimal_posting_time IS 'AI-determined optimal time for posting this content';
