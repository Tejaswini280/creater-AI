-- 0004_seed_essential_data.sql
-- Seed essential data without conflicts
-- Fixed: Removed DO blocks that cause syntax errors in Railway PostgreSQL

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
-- Using INSERT with WHERE NOT EXISTS subquery for idempotency
INSERT INTO templates (title, description, category, type, metadata, is_featured)
SELECT 'Social Media Post', 'Basic social media post template', 'social', 'post', '{"structure": "hook-content-cta", "length": "short"}'::JSONB, true
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Social Media Post');

INSERT INTO templates (title, description, category, type, metadata, is_featured)
SELECT 'Blog Article', 'Long-form blog article template', 'blog', 'article', '{"structure": "intro-body-conclusion", "length": "long"}'::JSONB, true
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Blog Article');

INSERT INTO templates (title, description, category, type, metadata, is_featured)
SELECT 'Product Launch', 'Product announcement template', 'marketing', 'announcement', '{"structure": "problem-solution-benefits", "length": "medium"}'::JSONB, false
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Product Launch');

INSERT INTO templates (title, description, category, type, metadata, is_featured)
SELECT 'Educational Content', 'How-to and tutorial template', 'education', 'tutorial', '{"structure": "overview-steps-summary", "length": "medium"}'::JSONB, true
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Educational Content');

-- Insert hashtag suggestions (with idempotent check)
-- Note: Using trend_score (0-100) instead of popularity_score to match actual schema
-- Using INSERT with WHERE NOT EXISTS subquery for idempotency
INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#socialmedia', 'instagram', 'marketing', 96, 15000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#socialmedia' AND platform = 'instagram');

INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#contentcreator', 'instagram', 'lifestyle', 94, 12000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#contentcreator' AND platform = 'instagram');

INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#digitalmarketing', 'linkedin', 'business', 98, 18000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#digitalmarketing' AND platform = 'linkedin');

INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#tech', 'twitter', 'technology', 92, 10000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#tech' AND platform = 'twitter');

INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#startup', 'linkedin', 'business', 90, 8000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#startup' AND platform = 'linkedin');

INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#ai', 'twitter', 'technology', 96, 16000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#ai' AND platform = 'twitter');

INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#marketing', 'facebook', 'business', 94, 14000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#marketing' AND platform = 'facebook');

INSERT INTO hashtag_suggestions (hashtag, platform, category, trend_score, usage_count)
SELECT '#content', 'instagram', 'lifestyle', 88, 9000
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE hashtag = '#content' AND platform = 'instagram');

-- Insert sample niches (with conflict resolution)
INSERT INTO niches (name, category, description, trend_score, difficulty, profitability, keywords)
VALUES 
    ('Sustainable Living', 'lifestyle', 'Eco-friendly lifestyle and products', 85, 'medium', 'high', ARRAY['sustainability', 'eco-friendly', 'green-living']),
    ('Digital Marketing', 'business', 'Online marketing strategies and tools', 92, 'hard', 'very-high', ARRAY['seo', 'social-media', 'content-marketing']),
    ('Personal Finance', 'finance', 'Money management and investment advice', 88, 'medium', 'high', ARRAY['budgeting', 'investing', 'financial-planning'])
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    trend_score = EXCLUDED.trend_score,
    difficulty = EXCLUDED.difficulty,
    profitability = EXCLUDED.profitability,
    keywords = EXCLUDED.keywords,
    updated_at = NOW();
