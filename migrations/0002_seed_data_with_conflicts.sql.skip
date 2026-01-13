-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA WITH PROPER ON CONFLICT HANDLING
-- ═══════════════════════════════════════════════════════════════════════════════
-- Seeds essential data using proper ON CONFLICT with matching UNIQUE constraints
-- Safe to run multiple times - fully idempotent
-- Date: 2026-01-10
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: SEED AI ENGAGEMENT PATTERNS (WITH PROPER ON CONFLICT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert AI engagement patterns with ON CONFLICT on UNIQUE constraint
INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size, metadata) 
VALUES 
  ('instagram', 'fitness', ARRAY['09:00', '12:00', '17:00'], 0.85, 1000, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('instagram', 'tech', ARRAY['10:00', '14:00', '19:00'], 0.82, 800, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('instagram', 'lifestyle', ARRAY['08:00', '13:00', '18:00'], 0.88, 1200, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('instagram', 'business', ARRAY['09:00', '12:00', '17:00'], 0.79, 600, '{"source": "analytics", "confidence": "medium"}'::jsonb),
  ('instagram', 'education', ARRAY['10:00', '15:00', '20:00'], 0.83, 500, '{"source": "analytics", "confidence": "medium"}'::jsonb),
  ('youtube', 'fitness', ARRAY['14:00', '20:00'], 0.90, 500, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('youtube', 'tech', ARRAY['15:00', '21:00'], 0.87, 600, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('youtube', 'lifestyle', ARRAY['13:00', '19:00'], 0.85, 400, '{"source": "analytics", "confidence": "medium"}'::jsonb),
  ('youtube', 'education', ARRAY['16:00', '20:00'], 0.88, 700, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('tiktok', 'fitness', ARRAY['18:00', '20:00', '22:00'], 0.92, 1500, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('tiktok', 'lifestyle', ARRAY['17:00', '19:00', '21:00'], 0.89, 1200, '{"source": "analytics", "confidence": "high"}'::jsonb),
  ('tiktok', 'tech', ARRAY['19:00', '21:00'], 0.84, 800, '{"source": "analytics", "confidence": "medium"}'::jsonb),
  ('facebook', 'lifestyle', ARRAY['09:00', '15:00', '19:00'], 0.75, 900, '{"source": "analytics", "confidence": "medium"}'::jsonb),
  ('facebook', 'business', ARRAY['08:00', '12:00', '16:00'], 0.77, 650, '{"source": "analytics", "confidence": "medium"}'::jsonb),
  ('linkedin', 'business', ARRAY['08:00', '12:00', '17:00'], 0.78, 400, '{"source": "analytics", "confidence": "medium"}'::jsonb),
  ('linkedin', 'tech', ARRAY['09:00', '13:00', '16:00'], 0.81, 350, '{"source": "analytics", "confidence": "medium"}'::jsonb)
ON CONFLICT (platform, category) 
DO UPDATE SET 
  optimal_times = EXCLUDED.optimal_times,
  engagement_score = EXCLUDED.engagement_score,
  sample_size = EXCLUDED.sample_size,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: SEED TEMPLATE DATA (IDEMPOTENT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert template data (using WHERE NOT EXISTS for safety)
INSERT INTO templates (title, description, category, type, content, is_featured, tags, rating, downloads) 
SELECT 'YouTube Video Script', 'Professional video script template for YouTube content', 'video', 'script', 
 'Hook: [Attention-grabbing opening]
Introduction: [Introduce yourself and topic]
Main Content: [Key points and value]
Call to Action: [What you want viewers to do]
Outro: [Thank viewers and subscribe reminder]', 
 true, ARRAY['youtube', 'video', 'script'], 4.8, 1250
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'YouTube Video Script');

INSERT INTO templates (title, description, category, type, content, is_featured, tags, rating, downloads)
SELECT 'Instagram Post Template', 'Engaging Instagram post template with hashtags', 'social', 'post',
 'Caption: [Engaging caption with value]
Hashtags: [Relevant hashtags]
Call to Action: [Encourage engagement]',
 true, ARRAY['instagram', 'social', 'post'], 4.7, 980
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Instagram Post Template');

INSERT INTO templates (title, description, category, type, content, is_featured, tags, rating, downloads)
SELECT 'LinkedIn Article Template', 'Professional LinkedIn article structure', 'business', 'article',
 'Headline: [Professional headline]
Opening: [Hook with industry insight]
Body: [Value-driven content]
Conclusion: [Key takeaways]
Call to Action: [Professional CTA]',
 true, ARRAY['linkedin', 'business', 'article'], 4.6, 750
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'LinkedIn Article Template');

INSERT INTO templates (title, description, category, type, content, is_featured, tags, rating, downloads)
SELECT 'TikTok Video Script', 'Viral TikTok video script template', 'video', 'script',
 'Hook (0-3s): [Grab attention immediately]
Content (3-15s): [Deliver value quickly]
CTA (15-30s): [Encourage interaction]',
 true, ARRAY['tiktok', 'video', 'script'], 4.9, 1500
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'TikTok Video Script');

INSERT INTO templates (title, description, category, type, content, is_featured, tags, rating, downloads)
SELECT 'Facebook Post Template', 'Engaging Facebook post for community building', 'social', 'post',
 'Opening: [Personal or relatable hook]
Value: [Share insight or tip]
Engagement: [Ask a question]
Hashtags: [2-3 relevant hashtags]',
 false, ARRAY['facebook', 'social', 'post'], 4.5, 650
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Facebook Post Template');

INSERT INTO templates (title, description, category, type, content, is_featured, tags, rating, downloads)
SELECT 'Fitness Motivation Post', 'Motivational fitness content template', 'fitness', 'post',
 'Motivation: [Inspiring fitness message]
Tip: [Practical fitness advice]
Challenge: [Encourage action]
Hashtags: #fitness #motivation #health',
 true, ARRAY['fitness', 'motivation', 'health'], 4.8, 1100
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Fitness Motivation Post');

INSERT INTO templates (title, description, category, type, content, is_featured, tags, rating, downloads)
SELECT 'Tech Tutorial Template', 'Step-by-step tech tutorial structure', 'tech', 'tutorial',
 'Problem: [What issue are we solving?]
Solution: [Step-by-step instructions]
Tips: [Pro tips and best practices]
Resources: [Links and tools mentioned]',
 true, ARRAY['tech', 'tutorial', 'education'], 4.7, 850
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Tech Tutorial Template');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: SEED HASHTAG SUGGESTIONS (IDEMPOTENT)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert hashtag suggestions (using WHERE NOT EXISTS for safety)
INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'instagram', 'fitness', '#fitness', 95, 1000000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'instagram' AND category = 'fitness' AND hashtag = '#fitness');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'instagram', 'fitness', '#workout', 90, 800000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'instagram' AND category = 'fitness' AND hashtag = '#workout');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'instagram', 'fitness', '#gym', 88, 750000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'instagram' AND category = 'fitness' AND hashtag = '#gym');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'instagram', 'tech', '#technology', 92, 500000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'instagram' AND category = 'tech' AND hashtag = '#technology');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'instagram', 'tech', '#coding', 89, 400000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'instagram' AND category = 'tech' AND hashtag = '#coding');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'instagram', 'lifestyle', '#lifestyle', 90, 900000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'instagram' AND category = 'lifestyle' AND hashtag = '#lifestyle');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'instagram', 'business', '#entrepreneur', 89, 450000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'instagram' AND category = 'business' AND hashtag = '#entrepreneur');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'youtube', 'tech', '#technology', 85, 200000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'youtube' AND category = 'tech' AND hashtag = '#technology');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'youtube', 'fitness', '#fitness', 90, 150000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'youtube' AND category = 'fitness' AND hashtag = '#fitness');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'tiktok', 'fitness', '#fitness', 95, 500000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'tiktok' AND category = 'fitness' AND hashtag = '#fitness');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'tiktok', 'lifestyle', '#lifestyle', 92, 400000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'tiktok' AND category = 'lifestyle' AND hashtag = '#lifestyle');

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count, is_active)
SELECT 'linkedin', 'business', '#business', 87, 300000, true
WHERE NOT EXISTS (SELECT 1 FROM hashtag_suggestions WHERE platform = 'linkedin' AND category = 'business' AND hashtag = '#business');

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: SEED NICHE DATA WITH ON CONFLICT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert niche data with ON CONFLICT on UNIQUE constraint
INSERT INTO niches (name, category, trend_score, difficulty, profitability, keywords, description)
VALUES 
  ('Fitness for Beginners', 'fitness', 85, 'medium', 'high', 
   ARRAY['beginner fitness', 'home workouts', 'fitness tips', 'weight loss'], 
   'Fitness content targeted at people just starting their fitness journey'),
  ('Tech Reviews', 'technology', 90, 'high', 'high',
   ARRAY['tech review', 'gadget review', 'smartphone', 'laptop'],
   'In-depth reviews of the latest technology products and gadgets'),
  ('Lifestyle Vlogs', 'lifestyle', 75, 'low', 'medium',
   ARRAY['daily vlog', 'lifestyle', 'morning routine', 'productivity'],
   'Personal lifestyle content showing daily routines and experiences'),
  ('Business Tips', 'business', 80, 'medium', 'high',
   ARRAY['business tips', 'entrepreneurship', 'startup', 'marketing'],
   'Educational content for entrepreneurs and business owners'),
  ('Cooking Tutorials', 'lifestyle', 88, 'low', 'medium',
   ARRAY['cooking', 'recipes', 'food', 'kitchen tips'],
   'Step-by-step cooking tutorials and recipe content'),
  ('Personal Finance', 'business', 92, 'medium', 'high',
   ARRAY['personal finance', 'investing', 'budgeting', 'money tips'],
   'Financial education and money management advice'),
  ('Travel Vlogs', 'lifestyle', 78, 'medium', 'medium',
   ARRAY['travel', 'adventure', 'destinations', 'travel tips'],
   'Travel experiences and destination guides'),
  ('Mental Health Awareness', 'lifestyle', 86, 'low', 'low',
   ARRAY['mental health', 'wellness', 'self care', 'mindfulness'],
   'Content focused on mental health awareness and wellness practices')
ON CONFLICT (name) 
DO UPDATE SET 
  trend_score = EXCLUDED.trend_score,
  difficulty = EXCLUDED.difficulty,
  profitability = EXCLUDED.profitability,
  keywords = EXCLUDED.keywords,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: CREATE TEST USER WITH ON CONFLICT (OAUTH COMPATIBLE)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create passwordless test user with ON CONFLICT on UNIQUE email constraint (OAuth system)
-- Fixed: Explicitly set password to NULL for OAuth compatibility
INSERT INTO users (email, first_name, last_name, profile_image_url, password) 
VALUES 
  ('test@railway.app', 'Railway', 'OAuth', 'https://via.placeholder.com/150', NULL)
ON CONFLICT (email) 
DO UPDATE SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  profile_image_url = EXCLUDED.profile_image_url,
  password = NULL,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Seed data migration completed successfully - All ON CONFLICT operations safe' as status;