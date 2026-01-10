const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/creators_dev_db');

async function checkConstraints() {
  try {
    const constraints = await sql`
      SELECT constraint_name, table_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'UNIQUE' 
      AND table_schema = 'public'
      AND table_name IN ('users', 'ai_engagement_patterns', 'niches')
      ORDER BY table_name, constraint_name
    `;
    
    console.log('Current UNIQUE constraints:');
    constraints.forEach(c => console.log(`  ${c.table_name}.${c.constraint_name}`));
    
    const required = ['users_email_key', 'ai_engagement_patterns_platform_category_key', 'niches_name_key'];
    const existing = constraints.map(c => c.constraint_name);
    const missing = required.filter(r => !existing.includes(r));
    
    console.log('\nMissing constraints:', missing.length > 0 ? missing : 'None');
    
    // Test if we can add the constraints
    if (missing.length > 0) {
      console.log('\nTesting constraint addition...');
      
      for (const constraint of missing) {
        try {
          if (constraint === 'users_email_key') {
            await sql`ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)`;
            console.log('✅ Added users_email_key');
          } else if (constraint === 'ai_engagement_patterns_platform_category_key') {
            await sql`ALTER TABLE ai_engagement_patterns ADD CONSTRAINT ai_engagement_patterns_platform_category_key UNIQUE (platform, category)`;
            console.log('✅ Added ai_engagement_patterns_platform_category_key');
          } else if (constraint === 'niches_name_key') {
            await sql`ALTER TABLE niches ADD CONSTRAINT niches_name_key UNIQUE (name)`;
            console.log('✅ Added niches_name_key');
          }
        } catch (error) {
          console.log(`❌ Failed to add ${constraint}: ${error.message}`);
        }
      }
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkConstraints();