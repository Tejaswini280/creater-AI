/**
 * Generate Bcrypt Hash for Admin Password
 * This script generates the production-safe bcrypt hash for the admin password
 * Run: node scripts/generate-admin-hash.cjs
 */

const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'Intern2025#';
  const saltRounds = 12; // Production standard - matches server/auth.ts
  
  console.log('🔐 Generating bcrypt hash for admin password...');
  console.log('Password:', password);
  console.log('Salt Rounds:', saltRounds);
  console.log('');
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Hash generated successfully!');
    console.log('');
    console.log('Bcrypt Hash:');
    console.log(hash);
    console.log('');
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log('✅ Hash verification:', isValid ? 'PASSED' : 'FAILED');
    console.log('');
    
    // Generate SQL INSERT statement
    console.log('SQL INSERT Statement:');
    console.log('-------------------');
    console.log(`INSERT INTO users (id, email, password, first_name, last_name, is_active, created_at, updated_at)`);
    console.log(`VALUES (`);
    console.log(`  'admin-tejaswini-primary',`);
    console.log(`  'tejaswini.kawade@renaissa.ai',`);
    console.log(`  '${hash}',`);
    console.log(`  'Tejaswini',`);
    console.log(`  'Kawade',`);
    console.log(`  true,`);
    console.log(`  NOW(),`);
    console.log(`  NOW()`);
    console.log(`)`);
    console.log(`ON CONFLICT (email) DO NOTHING;`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error generating hash:', error);
    process.exit(1);
  }
}

generateHash();
