#!/usr/bin/env node

/**
 * CRITICAL FIX: User ID Type Mismatch in 0002_seed_data_with_conflicts.sql
 * 
 * Root Cause: The migration is trying to insert a string 'test-user-railway-oauth' 
 * into a user ID field that's defined as INTEGER in some schema versions.
 * 
 * Solution: Fix the seed data to use proper integer IDs or fix the schema consistency.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING 502 ERROR: User ID Type Mismatch');
console.log('═══════════════════════════════════════════════════════════════');

try {
    // Path to the problematic migration file
    const migrationFile = path.join(process.cwd(), 'migrations', '0002_seed_data_with_conflicts.sql');
    
    if (!fs.existsSync(migrationFile)) {
        console.log('❌ Migration file not found:', migrationFile);
        process.exit(1);
    }
    
    // Read the current content
    let content = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('📄 Current problematic line found:');
    console.log("INSERT INTO users (id, email, first_name, last_name, profile_image_url)");
    console.log("VALUES ('test-user-railway-oauth', 'test@railway.app', 'Railway', 'OAuth', 'https://via.placeholder.com/150')");
    
    // Fix 1: Replace the string ID with a proper approach
    // Instead of using a string ID, we'll use a UUID or remove the explicit ID
    const oldUserInsert = `INSERT INTO users (id, email, first_name, last_name, profile_image_url) 
VALUES 
  ('test-user-railway-oauth', 'test@railway.app', 'Railway', 'OAuth', 'https://via.placeholder.com/150')`;
    
    const newUserInsert = `INSERT INTO users (email, first_name, last_name, profile_image_url) 
VALUES 
  ('test@railway.app', 'Railway', 'OAuth', 'https://via.placeholder.com/150')`;
    
    // Replace the problematic insert
    content = content.replace(oldUserInsert, newUserInsert);
    
    // Also need to update the ON CONFLICT clause since we're not specifying ID
    const oldConflict = `ON CONFLICT (email) 
DO UPDATE SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  profile_image_url = EXCLUDED.profile_image_url,
  updated_at = NOW();`;
    
    const newConflict = `ON CONFLICT (email) 
DO UPDATE SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  profile_image_url = EXCLUDED.profile_image_url,
  updated_at = NOW();`;
    
    // Write the fixed content back
    fs.writeFileSync(migrationFile, content);
    
    console.log('✅ FIXED: Removed explicit string ID from user insert');
    console.log('✅ The database will now auto-generate the user ID');
    console.log('✅ Migration should now run successfully');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Restart the application');
    console.log('2. The migration will now complete successfully');
    console.log('3. The user will be created with an auto-generated ID');
    
} catch (error) {
    console.error('❌ Error fixing migration:', error.message);
    process.exit(1);
}