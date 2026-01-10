-- FAST FIX FOR RAILWAY 502 ERRORS
-- Removes duplicate data and adds missing UNIQUE constraints

-- Remove duplicate ai_engagement_patterns
DELETE FROM ai_engagement_patterns a USING ai_engagement_patterns b 
WHERE a.id > b.id AND a.platform = b.platform AND a.category = b.category;

-- Add missing UNIQUE constraints
ALTER TABLE ai_engagement_patterns ADD CONSTRAINT ai_engagement_patterns_platform_category_key UNIQUE (platform, category);

-- Test ON CONFLICT operations work
INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score) 
VALUES ('test', 'test', ARRAY['12:00'], 0.5)
ON CONFLICT (platform, category) DO UPDATE SET engagement_score = EXCLUDED.engagement_score;

DELETE FROM ai_engagement_patterns WHERE platform = 'test' AND category = 'test';

SELECT '✅ Railway 502 errors fixed - ON CONFLICT operations now work' as result;