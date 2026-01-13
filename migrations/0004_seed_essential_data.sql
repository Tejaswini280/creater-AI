-- 0004_seed_essential_data.sql
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
-- Note: Using 'title' column to match the actual schema in 0001_core_tables_idempotent.sql
-- Since title doesn't have a unique constraint, we'll use a different approach
DO $$
BEGIN
    -- Social Media Post
    IF NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Social Media Post') THEN
        INSERT INTO templates (title, description, category, type, metadata, is_featured)
        VALUES ('Social Media Post', 'Basic social media post template', 'social', 'post', '{"structure": "hook-content-cta", "length": "short"}'::JSONB, true);
    END IF;
    
    -- Blog Article
    IF NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Blog Article') THEN
        INSERT INTO templates (title, description, category, type, metadata, is_featured)
        VALUES ('Blog Article', 'Long-form blog article template', 'blog', 'article', '{"structure": "intro-body-conclusion", "length": "long"}'::JSONB, true);
    END IF;
    
    -- Product Launch
    IF NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Product Launch') THEN
        INSERT INTO templates (title, description, category, type, metadata, is_featured)
        VALUES ('Product Launch', 'Product announcement template', 'marketing', 'announcement', '{"structure": "problem-solution-benefits", "length": "medium"}'::JSONB, false);
    END IF;
    
    -- Educational Content
    IF NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Educational Content') THEN
        INSERT INTO templates (title, description, category, type, metadata, is_featured)
        VALUES ('Educational Content', 'How-to and tutorial template', 'education', 'tutorial', '{"structure": "overview-steps-summary", "length": "medium"}'::JSONB, true);
    END IF;
END $$;

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
