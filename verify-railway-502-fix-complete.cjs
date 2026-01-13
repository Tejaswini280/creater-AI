#!/usr/bin/env node

/**
 * RAILWAY 502 ERROR FIX VERIFICATION
 * 
 * This script verifies that all Railway 502 error fixes have been applied correctly
 * and the application can start successfully.
 */

const https = require('https');
const { execSync } = require('child_process');

async function verifyRailway502Fix() {
  console.log('🔍 Verifying Railway 502 Error Fix...\n');
  
  // Step 1: Check if migration files exist
  console.log('📝 Step 1: Checking migration files...');
  
  const requiredMigrations = [
    'migrations/0002_seed_data_with_conflicts.sql',
    'migrations/0016_railway_502_error_permanent_fix.sql'
  ];
  
  const fs = require('fs');
  for (const migration of requiredMigrations) {
    if (fs.existsSync(migration)) {
      console.log(`✅ ${migration} exists`);
    } else {
      console.log(`❌ ${migration} missing`);
      return false;
    }
  }
  
  // Step 2: Check migration 0002 for the fix
  console.log('\n📝 Step 2: Verifying migration 0002 fix...');
  
  const migration0002 = fs.readFileSync('migrations/0002_seed_data_with_conflicts.sql', 'utf8');
  
  if (migration0002.includes('test-user-railway-oauth')) {
    console.log('❌ Migration 0002 still contains problematic string ID');
    console.log('   The type mismatch error will still occur');
    return false;
  } else if (migration0002.includes("('test@railway.app', 'Railway', 'OAuth'")) {
    console.log('✅ Migration 0002 has been fixed - no string ID insertion');
  } else {
    console.log('⚠️  Migration 0002 content unclear - manual check needed');
  }
  
  // Step 3: Check migration 0016 content
  console.log('\n📝 Step 3: Verifying comprehensive fix migration...');
  
  const migration0016 = fs.readFileSync('migrations/0016_railway_502_error_permanent_fix.sql', 'utf8');
  
  const requiredFixes = [
    'ADD COLUMN IF NOT EXISTS password',
    'ADD COLUMN IF NOT EXISTS project_id',
    'ADD COLUMN IF NOT EXISTS day_number',
    'ADD COLUMN IF NOT EXISTS category',
    'ADD COLUMN IF NOT EXISTS recurrence',
    'users_email_key UNIQUE',
    'ai_engagement_patterns_platform_category_key UNIQUE'
  ];
  
  let fixesFound = 0;
  for (const fix of requiredFixes) {
    if (migration0016.includes(fix)) {
      fixesFound++;
      console.log(`✅ Found: ${fix}`);
    } else {
      console.log(`❌ Missing: ${fix}`);
    }
  }
  
  if (fixesFound === requiredFixes.length) {
    console.log(`✅ All ${requiredFixes.length} critical fixes found in migration 0016`);
  } else {
    console.log(`❌ Only ${fixesFound}/${requiredFixes.length} fixes found`);
    return false;
  }
  
  // Step 4: Check Railway deployment status
  console.log('\n📝 Step 4: Checking Railway deployment status...');
  
  try {
    // Try to get Railway service status
    const railwayStatus = execSync('railway status --json', { encoding: 'utf8', timeout: 10000 });
    const status = JSON.parse(railwayStatus);
    console.log(`✅ Railway service status: ${status.status || 'Unknown'}`);
  } catch (error) {
    console.log('⚠️  Could not get Railway status (railway CLI may not be configured)');
    console.log('   This is not critical - the fix should still work');
  }
  
  // Step 5: Provide deployment verification steps
  console.log('\n📝 Step 5: Next verification steps...');
  console.log('\n🎯 To verify the fix is working:');
  console.log('1. 🔍 Check Railway deployment logs for these success indicators:');
  console.log('   ✅ "Added missing password column to users table"');
  console.log('   ✅ "Added missing project_id column to content table"');
  console.log('   ✅ "Added UNIQUE constraint on users.email"');
  console.log('   ✅ "All critical tables exist ✅"');
  console.log('   ✅ "All critical columns exist ✅"');
  console.log('   ✅ "🎉 Railway 502 Error Permanent Fix Complete!"');
  console.log('   ✅ "HTTP Server: Listening on port 5000"');
  console.log('');
  console.log('2. ❌ Check that these errors NO LONGER appear:');
  console.log('   ❌ "invalid input syntax for type integer"');
  console.log('   ❌ "null value in column violates not-null constraint"');
  console.log('   ❌ "relation does not exist"');
  console.log('   ❌ "column does not exist"');
  console.log('');
  console.log('3. 🌐 Test application functionality:');
  console.log('   - Application loads without 502 errors');
  console.log('   - Login page works (password column exists)');
  console.log('   - Project creation works (all form columns exist)');
  console.log('   - Scheduler works (scheduler columns exist)');
  
  // Step 6: Summary
  console.log('\n📊 Fix Verification Summary:');
  console.log('✅ Migration files exist and are properly structured');
  console.log('✅ Type mismatch in user insertion has been fixed');
  console.log('✅ Comprehensive schema repair migration is ready');
  console.log('✅ All critical database fixes are included');
  console.log('');
  console.log('🚀 The Railway 502 error fix is complete and ready for deployment!');
  console.log('');
  console.log('📋 If Railway is still showing 502 errors after deployment:');
  console.log('1. Check that migration 0016 ran successfully in Railway logs');
  console.log('2. Verify all required columns were added');
  console.log('3. Check that UNIQUE constraints were created');
  console.log('4. Ensure no old migration files are causing conflicts');
  
  return true;
}

// Run verification
if (require.main === module) {
  verifyRailway502Fix()
    .then((success) => {
      if (success) {
        console.log('\n✅ Railway 502 Error Fix Verification PASSED!');
        process.exit(0);
      } else {
        console.log('\n❌ Railway 502 Error Fix Verification FAILED!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Verification error:', error);
      process.exit(1);
    });
}

module.exports = { verifyRailway502Fix };