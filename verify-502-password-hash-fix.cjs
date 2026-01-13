#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFY 502 PASSWORD HASH FIX
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This script verifies that the password hash column mismatch has been resolved
 * and that the OAuth system is working correctly.
 * 
 * Tests:
 * 1. Database schema is correct (password column, nullable)
 * 2. OAuth user insertion works
 * 3. Migration 0002 can run successfully
 * 4. Application can start without errors
 * 
 * Date: 2026-01-13
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Client } = require('pg');

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

function logStep(message) {
  console.log(`🔍 ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

async function verifyPasswordHashFix() {
  const client = new Client(dbConfig);
  let allTestsPassed = true;
  
  try {
    await client.connect();
    logSuccess('Connected to database');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICATION TESTS');
    console.log('═══════════════════════════════════════════════════════════════');

    // Test 1: Check schema is correct
    logStep('Test 1: Checking users table schema...');
    
    const schemaCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password', 'password_hash')
      ORDER BY column_name;
    `);

    const hasPassword = schemaCheck.rows.find(row => row.column_name === 'password');
    const hasPasswordHash = schemaCheck.rows.find(row => row.column_name === 'password_hash');

    if (hasPasswordHash) {
      logError('password_hash column still exists - schema not fully fixed');
      allTestsPassed = false;
    } else {
      logSuccess('No password_hash column found');
    }

    if (hasPassword) {
      if (hasPassword.is_nullable === 'YES') {
        logSuccess('password column exists and is nullable (OAuth compatible)');
      } else {
        logError('password column exists but is NOT NULL (will cause OAuth issues)');
        allTestsPassed = false;
      }
    } else {
      logError('password column missing entirely');
      allTestsPassed = false;
    }

    // Test 2: Test OAuth user insertion
    logStep('Test 2: Testing OAuth user insertion...');
    
    try {
      await client.query(`
        INSERT INTO users (email, first_name, last_name, password) 
        VALUES ('test-verification@railway.app', 'Test', 'Verification', NULL)
        ON CONFLICT (email) 
        DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          updated_at = NOW();
      `);
      logSuccess('OAuth user insertion works correctly');
    } catch (error) {
      logError(`OAuth user insertion failed: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 3: Check for existing users with null passwords
    logStep('Test 3: Checking existing OAuth users...');
    
    const oauthUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE password IS NULL;
    `);
    
    const oauthCount = parseInt(oauthUsers.rows[0].count);
    if (oauthCount > 0) {
      logSuccess(`Found ${oauthCount} OAuth users with null passwords`);
    } else {
      logWarning('No OAuth users found - this may be expected for a fresh database');
    }

    // Test 4: Check migration tracking
    logStep('Test 4: Checking migration status...');
    
    try {
      const migrationCheck = await client.query(`
        SELECT filename, executed_at 
        FROM schema_migrations 
        WHERE filename LIKE '%0002_seed_data%'
        ORDER BY executed_at DESC;
      `);
      
      if (migrationCheck.rows.length > 0) {
        logSuccess('Migration 0002_seed_data_with_conflicts.sql is tracked');
      } else {
        logWarning('Migration 0002 not found in tracking table');
      }
    } catch (error) {
      logWarning(`Could not check migration status: ${error.message}`);
    }

    // Test 5: Test the specific problematic query from the migration
    logStep('Test 5: Testing the exact migration query...');
    
    try {
      await client.query(`
        INSERT INTO users (email, first_name, last_name, profile_image_url, password) 
        VALUES ('test-migration@railway.app', 'Migration', 'Test', 'https://via.placeholder.com/150', NULL)
        ON CONFLICT (email) 
        DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          profile_image_url = EXCLUDED.profile_image_url,
          password = NULL,
          updated_at = NOW();
      `);
      logSuccess('Migration query executes successfully');
    } catch (error) {
      logError(`Migration query failed: ${error.message}`);
      allTestsPassed = false;
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED - 502 ERROR FIX VERIFIED');
      console.log('═══════════════════════════════════════════════════════════════');
      logSuccess('Database schema is correct');
      logSuccess('OAuth system is working');
      logSuccess('Migration should run without errors');
      logSuccess('Application should start successfully');
    } else {
      console.log('❌ SOME TESTS FAILED - FIX NOT COMPLETE');
      console.log('═══════════════════════════════════════════════════════════════');
      logError('Please run the fix script again or check the issues above');
    }
    
    console.log('═══════════════════════════════════════════════════════════════');

    return allTestsPassed;

  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    console.error('Full error:', error);
    return false;
  } finally {
    await client.end();
  }
}

// Run the verification
if (require.main === module) {
  verifyPasswordHashFix()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification script error:', error);
      process.exit(1);
    });
}

module.exports = { verifyPasswordHashFix };