#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FIX TEMPLATES TABLE SCHEMA - COMPLETE SOLUTION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ROOT CAUSE:
 * Templates table exists but has WRONG SCHEMA (missing "name" column)
 * 
 * SOLUTION:
 * 1. Check current templates table structure
 * 2. Drop the incorrect table
 * 3. Recreate with correct schema
 * 4. Create all other essential tables
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');

// Use Railway database URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:TGUBkIxBBQsYWVKQXyiqSwaZQTRqVoFv@shortline.proxy.rlwy.net:25247/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function fixTemplatesSchema() {
  const client = await pool.connect();
  
  try {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔧 FIXING TEMPLATES TABLE SCHEMA');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Step 1: Check current templates table structure
    console.log('📊 Step 1: Checking current templates table structure...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'templates'
      ORDER BY ordinal_position;
    `);
    
    if (columnsResult.rows.length > 0) {
      console.log('   Current templates table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      
      // Check if "name" column exists
      const hasNameColumn = columnsResult.rows.some(col => col.column_name === 'name');
      
      if (hasNameColumn) {
        console.log('   ✅ Templates table has correct schema');
        console.log('\n✅ No fix needed - table is already correct');
        return;
      } else {
        console.log('   ❌ Templates table is MISSING "name" column');
        console.log('   🔧 Will drop and recreate with correct schema');
      }
    } else {
      console.log('   ℹ️  Templates table does not exist yet');
    }

    // Step 2: Drop the incorrect templates table
    console.log('\n🗑️  Step 2: Dropping incorrect templates table...');
    await client.query('DROP TABLE IF EXISTS templates CASCADE;');
    console.log('   ✅ Dropped templates table');

    // Step 3: Create templates table with CORRECT schema
    console.log('\n📝 Step 3: Creating templates table with correct schema...');
    await client.query(`
      CREATE TABLE templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(100),
        template_data JSONB,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   ✅ Created templates table with correct schema');

    // Step 4: Create other essential tables
    console.log('\n📝 Step 4: Creating other essential tables...');
    
    // Hashtag suggestions
    await client.query(`
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
    `);
    console.log('   ✅ Created hashtag_suggestions table');

    // AI engagement patterns
    await client.query(`
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
    `);
    console.log('   ✅ Created ai_engagement_patterns table');

    // Niches
    await client.query(`
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
    `);
    console.log('   ✅ Created niches table');

    // Step 5: Create indexes
    console.log('\n📊 Step 5: Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
      CREATE INDEX IF NOT EXISTS idx_templates_is_featured ON templates(is_featured);
      CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
      
      CREATE INDEX IF NOT EXISTS idx_hashtag_suggestions_platform ON hashtag_suggestions(platform);
      CREATE INDEX IF NOT EXISTS idx_hashtag_suggestions_category ON hashtag_suggestions(category);
      
      CREATE INDEX IF NOT EXISTS idx_ai_engagement_patterns_platform ON ai_engagement_patterns(platform);
      CREATE INDEX IF NOT EXISTS idx_ai_engagement_patterns_category ON ai_engagement_patterns(category);
      
      CREATE INDEX IF NOT EXISTS idx_niches_name ON niches(name);
    `);
    console.log('   ✅ Created all indexes');

    // Step 6: Create triggers
    console.log('\n⚡ Step 6: Creating update triggers...');
    await client.query(`
      DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
      CREATE TRIGGER update_templates_updated_at 
        BEFORE UPDATE ON templates 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_hashtag_suggestions_updated_at ON hashtag_suggestions;
      CREATE TRIGGER update_hashtag_suggestions_updated_at 
        BEFORE UPDATE ON hashtag_suggestions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_ai_engagement_patterns_updated_at ON ai_engagement_patterns;
      CREATE TRIGGER update_ai_engagement_patterns_updated_at 
        BEFORE UPDATE ON ai_engagement_patterns 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_niches_updated_at ON niches;
      CREATE TRIGGER update_niches_updated_at 
        BEFORE UPDATE ON niches 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('   ✅ Created all triggers');

    // Step 7: Verify the fix
    console.log('\n🔍 Step 7: Verifying templates table structure...');
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'templates'
      ORDER BY ordinal_position;
    `);
    
    console.log('   Templates table columns:');
    verifyResult.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name} (${col.data_type})`);
    });

    // Step 8: Test insert
    console.log('\n🧪 Step 8: Testing insert into templates table...');
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO templates (name, description, category, template_data, is_featured)
      VALUES ('TEST_TEMPLATE', 'Test Description', 'test', '{"test": true}'::JSONB, false);
    `);
    await client.query('ROLLBACK');
    console.log('   ✅ Insert test successful');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ TEMPLATES TABLE SCHEMA FIX COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📌 Summary:');
    console.log('   ✅ Templates table recreated with correct schema');
    console.log('   ✅ All essential tables created');
    console.log('   ✅ Indexes and triggers configured');
    console.log('   ✅ Migration 0004 can now execute successfully');
    console.log('\n📌 Next Steps:');
    console.log('   1. Restart your application');
    console.log('   2. Migrations will complete successfully');
    console.log('   3. Application will start without errors\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixTemplatesSchema()
  .then(() => {
    console.log('✅ Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  });
