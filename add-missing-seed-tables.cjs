#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function addMissingTables() {
  try {
    console.log('Adding missing tables for seeding...');
    
    // Add analytics table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        project_id INTEGER,
        metric_type VARCHAR NOT NULL,
        metric_value NUMERIC NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Analytics table created');
    
    // Add scheduled_content table
    await sql`
      CREATE TABLE IF NOT EXISTS scheduled_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        project_id INTEGER,
        title VARCHAR NOT NULL,
        scheduled_time TIMESTAMP NOT NULL,
        platform VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'scheduled' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Scheduled_content table created');
    
    // Verify
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public' 
      AND table_name IN ('analytics', 'scheduled_content')
      ORDER BY table_name
    `;
    
    console.log(`\n✅ Verified: Found ${tables.length} tables`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

addMissingTables();
