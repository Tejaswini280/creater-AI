const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/creators_dev_db');

async function fixRailway502() {
  try {
    console.log('🔧 Fixing Railway 502 errors...');
    
    // Remove duplicate ai_engagement_patterns
    console.log('Removing duplicates...');
    await sql`
      DELETE FROM ai_engagement_patterns a USING ai_engagement_patterns b 
      WHERE a.id > b.id AND a.platform = b.platform AND a.category = b.category
    `;
    
    // Add missing UNIQUE constraint
    console.log('Adding UNIQUE constraint...');
    await sql`
      ALTER TABLE ai_engagement_patterns 
      ADD CONSTRAINT ai_engagement_patterns_platform_category_key 
      UNIQUE (platform, category)
    `;
    
    // Test ON CONFLICT works
    console.log('Testing ON CONFLICT...');
    await sql`
      INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score) 
      VALUES ('test', 'test', ARRAY['12:00'], 0.5)
      ON CONFLICT (platform, category) DO UPDATE SET engagement_score = EXCLUDED.engagement_score
    `;
    
    await sql`DELETE FROM ai_engagement_patterns WHERE platform = 'test' AND category = 'test'`;
    
    console.log('✅ Railway 502 errors fixed - ON CONFLICT operations now work');
    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixRailway502();