const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/creator_ai_studio'
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'server/migrations/enhanced-project-workflow.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running enhanced project workflow migration...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Enhanced project workflow migration completed successfully');

    // Verify tables exist
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'projects', 
        'content', 
        'ai_projects', 
        'ai_generated_content', 
        'ai_content_calendar',
        'ai_engagement_patterns',
        'project_content_management',
        'content_action_history'
      )
      ORDER BY table_name;
    `;

    const result = await client.query(tableCheckQuery);
    console.log('📊 Verified tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check sample data
    const sampleDataQuery = 'SELECT COUNT(*) as count FROM ai_engagement_patterns';
    const sampleResult = await client.query(sampleDataQuery);
    console.log(`📈 Sample engagement patterns: ${sampleResult.rows[0].count} records`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration().catch(console.error);