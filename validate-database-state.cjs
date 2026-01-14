#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATABASE STATE VALIDATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Validates database state before running migrations to prevent common issues.
 * 
 * CHECKS:
 * 1. Database connection
 * 2. Users table exists
 * 3. Password column state (nullable vs NOT NULL)
 * 4. Invalid password values
 * 5. Email unique constraint
 * 6. Required indexes
 * 7. Migration history
 * 
 * USAGE:
 * node validate-database-state.cjs
 * 
 * EXIT CODES:
 * 0 = All checks passed
 * 1 = Critical issues found
 * 2 = Warnings found (non-critical)
 * 
 * Date: 2026-01-14
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log('\n═══════════════════════════════════════════════════════════════', colors.cyan);
  log(`  ${message}`, colors.cyan);
  log('═══════════════════════════════════════════════════════════════', colors.cyan);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function validateDatabaseState() {
  const issues = {
    critical: [],
    warnings: [],
  };

  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    header('DATABASE STATE VALIDATION');
    log('');

    // Check 1: Database connection
    log('🔍 Check 1: Database connection...', colors.yellow);
    try {
      await pool.query('SELECT NOW()');
      success('Database connection successful');
    } catch (err) {
      error(`Database connection failed: ${err.message}`);
      issues.critical.push('Database connection failed');
      return issues;
    }

    // Check 2: Users table exists
    log('\n🔍 Check 2: Users table exists...', colors.yellow);
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as exists
    `);
    
    if (tableCheck.rows[0].exists) {
      success('Users table exists');
    } else {
      warning('Users table does not exist (will be created by migration)');
      issues.warnings.push('Users table missing');
    }

    // Check 3: Password column state
    if (tableCheck.rows[0].exists) {
      log('\n🔍 Check 3: Password column state...', colors.yellow);
      const columnCheck = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'users' 
        AND column_name IN ('password', 'password_hash')
        ORDER BY column_name
      `);

      if (columnCheck.rows.length === 0) {
        warning('Password columns do not exist (will be created by migration)');
        issues.warnings.push('Password columns missing');
      } else {
        for (const col of columnCheck.rows) {
          if (col.is_nullable === 'YES') {
            success(`${col.column_name} is nullable ✓`);
          } else {
            error(`${col.column_name} has NOT NULL constraint (will break OAuth users)`);
            issues.critical.push(`${col.column_name} NOT NULL constraint`);
          }
        }
      }

      // Check 4: Invalid password values
      log('\n🔍 Check 4: Invalid password values...', colors.yellow);
      const invalidPasswords = await pool.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE password IN ('', 'temp_password_needs_reset', 'null', 'undefined', 'TEMP_PASSWORD', 'oauth_user_no_password')
        OR password_hash IN ('', 'temp_password_needs_reset', 'null', 'undefined', 'TEMP_PASSWORD', 'oauth_user_no_password')
      `);

      const invalidCount = parseInt(invalidPasswords.rows[0].count);
      if (invalidCount > 0) {
        warning(`Found ${invalidCount} users with invalid password values (will be cleaned by migration)`);
        issues.warnings.push(`${invalidCount} invalid password values`);
      } else {
        success('No invalid password values found');
      }

      // Check 5: Email unique constraint
      log('\n🔍 Check 5: Email unique constraint...', colors.yellow);
      const uniqueCheck = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%email%'
      `);

      const uniqueIndexCheck = await pool.query(`
        SELECT COUNT(*) as count
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexdef LIKE '%UNIQUE%'
        AND indexdef LIKE '%email%'
      `);

      const hasUniqueConstraint = parseInt(uniqueCheck.rows[0].count) > 0 || parseInt(uniqueIndexCheck.rows[0].count) > 0;
      
      if (hasUniqueConstraint) {
        success('Email unique constraint exists');
      } else {
        warning('Email unique constraint missing (will be created by migration)');
        issues.warnings.push('Email unique constraint missing');
      }

      // Check 6: Required indexes
      log('\n🔍 Check 6: Required indexes...', colors.yellow);
      const requiredIndexes = [
        'idx_users_email',
        'idx_users_password_hash',
        'idx_users_is_active',
        'idx_users_created_at',
      ];

      for (const indexName of requiredIndexes) {
        const indexCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM pg_indexes
            WHERE tablename = 'users'
            AND indexname = $1
          ) as exists
        `, [indexName]);

        if (indexCheck.rows[0].exists) {
          success(`Index ${indexName} exists`);
        } else {
          warning(`Index ${indexName} missing (will be created by migration)`);
          issues.warnings.push(`Index ${indexName} missing`);
        }
      }
    }

    // Check 7: Migration history
    log('\n🔍 Check 7: Migration history...', colors.yellow);
    const migrationTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
      ) as exists
    `);

    if (migrationTableCheck.rows[0].exists) {
      const migrationCount = await pool.query(`
        SELECT COUNT(*) as count FROM schema_migrations
      `);
      success(`Migration tracking table exists (${migrationCount.rows[0].count} migrations executed)`);

      // Check for duplicate password migrations
      const duplicateMigrations = await pool.query(`
        SELECT filename
        FROM schema_migrations
        WHERE filename LIKE '%password%'
        OR filename LIKE '%oauth%'
        ORDER BY executed_at
      `);

      if (duplicateMigrations.rows.length > 5) {
        warning(`Found ${duplicateMigrations.rows.length} password-related migrations (consolidation recommended)`);
        issues.warnings.push('Too many password migrations');
      }
    } else {
      warning('Migration tracking table does not exist (will be created by migration)');
      issues.warnings.push('Migration tracking missing');
    }

    // Summary
    header('VALIDATION SUMMARY');
    log('');

    if (issues.critical.length === 0 && issues.warnings.length === 0) {
      success('All checks passed! Database is ready for migrations.');
      log('');
      return 0;
    }

    if (issues.critical.length > 0) {
      error(`Found ${issues.critical.length} critical issue(s):`);
      issues.critical.forEach(issue => log(`  - ${issue}`, colors.red));
      log('');
      error('⚠️  CRITICAL ISSUES MUST BE FIXED BEFORE DEPLOYMENT');
      log('');
      info('Run migration 0025 to fix these issues:');
      log('  node run-migrations.js', colors.cyan);
      log('');
      return 1;
    }

    if (issues.warnings.length > 0) {
      warning(`Found ${issues.warnings.length} warning(s):`);
      issues.warnings.forEach(issue => log(`  - ${issue}`, colors.yellow));
      log('');
      info('These warnings are non-critical and will be fixed by migration 0025');
      log('');
      return 2;
    }

  } catch (err) {
    error(`Validation failed: ${err.message}`);
    console.error(err);
    return 1;
  } finally {
    await pool.end();
  }
}

// Run validation
validateDatabaseState()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(err => {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
