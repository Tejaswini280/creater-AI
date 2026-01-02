-- Enhanced Project Workflow Migration
-- This migration ensures all tables required for the enhanced two-page project creation workflow exist

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
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

-- Create content table if it doesn't exist
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
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
  ai_generated BOOLEAN DEFAULT false,
  day_number INTEGER,
  is_paused BOOLEAN DEFAULT false,
  is_stopped BOOLEAN DEFAULT false,
  can_publish BOOLEAN DEFAULT true,
  publish_order INTEGER DEFAULT 0,
  content_version INTEGER DEFAULT 1,
  last_regenerated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ai_projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_projects (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  project_type VARCHAR NOT NULL,
  duration INTEGER NOT NULL,
  custom_duration INTEGER,
  target_channels TEXT[] NOT NULL,
  content_frequency VARCHAR NOT NULL,
  target_audience VARCHAR,
  brand_voice VARCHAR,
  content_goals TEXT[],
  content_title VARCHAR,
  content_description TEXT,
  channel_type VARCHAR,
  tags TEXT[],
  ai_settings JSONB,
  status VARCHAR NOT NULL DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ai_generated_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  platform VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft',
  scheduled_date TIMESTAMP,
  published_at TIMESTAMP,
  hashtags TEXT[],
  metadata JSONB,
  ai_model VARCHAR DEFAULT 'gemini-2.5-flash',
  generation_prompt TEXT,
  confidence DECIMAL(3,2),
  engagement_prediction JSONB,
  day_number INTEGER NOT NULL,
  is_paused BOOLEAN DEFAULT false,
  is_stopped BOOLEAN DEFAULT false,
  can_publish BOOLEAN DEFAULT true,
  publish_order INTEGER DEFAULT 0,
  content_version INTEGER DEFAULT 1,
  last_regenerated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ai_content_calendar table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_content_calendar (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  content_id INTEGER NOT NULL REFERENCES ai_generated_content(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  scheduled_time VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'scheduled',
  optimal_posting_time BOOLEAN DEFAULT false,
  engagement_score DECIMAL(3,2),
  ai_optimized BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ai_engagement_patterns table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_engagement_patterns (
  id SERIAL PRIMARY KEY,
  platform VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  optimal_times TEXT[] NOT NULL,
  engagement_score DECIMAL(3,2),
  sample_size INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create project_content_management table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_content_management (
  id SERIAL PRIMARY KEY,
  ai_project_id INTEGER NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL,
  total_days INTEGER NOT NULL,
  content_per_day INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  is_paused BOOLEAN DEFAULT false,
  is_stopped BOOLEAN DEFAULT false,
  can_publish_unpublished BOOLEAN DEFAULT true,
  original_duration INTEGER NOT NULL,
  extended_days INTEGER DEFAULT 0,
  extension_history JSONB DEFAULT '[]',
  calendar_updated_at TIMESTAMP DEFAULT NOW(),
  last_content_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create content_action_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_action_history (
  id SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL REFERENCES ai_generated_content(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  previous_status VARCHAR,
  new_status VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_ai_project_id ON ai_generated_content(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_ai_project_id ON ai_content_calendar(ai_project_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_calendar_scheduled_date ON ai_content_calendar(scheduled_date);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- Add foreign key for content.project_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'content_project_id_fkey' 
    AND table_name = 'content'
  ) THEN
    ALTER TABLE content ADD CONSTRAINT content_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update existing projects to have enhanced workflow metadata
UPDATE projects 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"enhancedWorkflow": false}'::jsonb
WHERE metadata IS NULL OR NOT metadata ? 'enhancedWorkflow';

-- Create a function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at 
  BEFORE UPDATE ON content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_projects_updated_at ON ai_projects;
CREATE TRIGGER update_ai_projects_updated_at 
  BEFORE UPDATE ON ai_projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_generated_content_updated_at ON ai_generated_content;
CREATE TRIGGER update_ai_generated_content_updated_at 
  BEFORE UPDATE ON ai_generated_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_content_calendar_updated_at ON ai_content_calendar;
CREATE TRIGGER update_ai_content_calendar_updated_at 
  BEFORE UPDATE ON ai_content_calendar 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample engagement patterns for better AI optimization
INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size) 
VALUES 
  ('instagram', 'fitness', ARRAY['09:00', '12:00', '17:00'], 0.85, 1000),
  ('instagram', 'tech', ARRAY['10:00', '14:00', '19:00'], 0.82, 800),
  ('instagram', 'lifestyle', ARRAY['08:00', '13:00', '18:00'], 0.88, 1200),
  ('youtube', 'fitness', ARRAY['14:00', '20:00'], 0.90, 500),
  ('youtube', 'tech', ARRAY['15:00', '21:00'], 0.87, 600),
  ('facebook', 'lifestyle', ARRAY['09:00', '15:00', '19:00'], 0.75, 900),
  ('tiktok', 'fitness', ARRAY['18:00', '20:00', '22:00'], 0.92, 1500),
  ('linkedin', 'business', ARRAY['08:00', '12:00', '17:00'], 0.78, 400)
ON CONFLICT DO NOTHING;

COMMIT;