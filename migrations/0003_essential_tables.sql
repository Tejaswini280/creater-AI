-- 0003_essential_tables.sql
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
