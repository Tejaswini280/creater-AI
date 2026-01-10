#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RAILWAY PRODUCTION REPAIR VERIFICATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * This script comprehensively verifies that the Railway production repair
 * migration was successful and all database issues are resolved.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { Client } = require('pg');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log(message, 'yellow');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  console.log('');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function connectToDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    logError('DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    logSuccess('Connected to Railway database');
    return client;
  } catch (error) {
    logError(`Failed to connect to database: ${error.message}`);
    process.exit(1);
  }
}

async function verifyTableExists(client, tableName, description) {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      ) as exists
    `, [tableName]);

    if (result.rows[0].exists) {
      logSuccess(`${description} table exists`);
      return true;
    } else {
      logError(`${description} table missing`);
      return false;
    }
  } catch (error) {
    logError(`Error checking ${tableName} table: ${error.message}`);
    return false;
  }
}

async function verifyColumnExists(client, tableName, columnName, description) {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      ) as exists
    `, [tableName, columnName]);

    if (result.rows[0].exists) {
      logSuccess(`${description} column exists in ${tableName}`);
      return true;
    } else {
      logError(`${description} column missing from ${tableName}`);
      return false;
    }
  } catch (error) {
    logError(`Error checking ${columnName} column in ${tableName}: ${error.message}`);
    return false;
  }
}

async function verifyIndexExists(client, indexName, description) {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = $1
      ) as exists
    `, [indexName]);

    if (result.rows[0].exists) {
      logSuccess(`${description} index exists`);
      return true;
    } else {
      logWarning(`${description} index missing (non-critical)`);
      return false;
    }
  } catch (error) {
    logWarning(`Error checking ${indexName} index: ${error.message}`);
    return false;
  }
}

async function verifyConstraintExists(client, constraintName, description) {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' AND constraint_name = $1
      ) as exists
    `, [constraintName]);

    if (result.rows[0].exists) {
      logSuccess(`${description} constraint exists`);
      return true;
    } else {
      logWarning(`${description} constraint missing (may be OK)`);
      return false;
    }
  } catch (error) {
    logWarning(`Error checking ${constraintName} constraint: ${error.message}`);
    return false;
  }
}

async function testBasicOperations(client) {
  try {
    // Test user insertion (the critical operation that was failing)
    const testUserId = `test-verify-${Date.now()}`;
    const testEmail = `test-verify-${Date.now()}@example.com`;
    
    await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    `, [testUserId, testEmail, 'test_password_hash', 'Test', 'User']);

    logSuccess('User insertion test passed');

    // Test user query
    const userResult = await client.query(`
      SELECT id, email, first_name, last_name, password IS NOT NULL as has_password
      FROM users WHERE id = $1
    `, [testUserId]);

    if (userResult.rows.length > 0 && userResult.rows[0].has_password) {
      logSuccess('User query test passed');
      logSuccess('Password column is properly populated');
    } else {
      logError('User query test failed or password column empty');
      return false;
    }

    // Test project creation
    const projectResult = await client.query(`
      INSERT INTO projects (user_id, name, description, type, status) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id
    `, [testUserId, 'Test Project', 'Test Description', 'video', 'active']);

    if (projectResult.rows.length > 0) {
      logSuccess('Project creation test passed');
    } else {
      logError('Project creation test failed');
      return false;
    }

    // Test content creation
    const projectId = projectResult.rows[0].id;
    await client.query(`
      INSERT INTO content (user_id, project_id, title, description, platform, content_type, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [testUserId, projectId, 'Test Content', 'Test Description', 'instagram', 'post', 'draft']);

    logSuccess('Content creation test passed');

    // Clean up test data
    await client.query('DELETE FROM content WHERE user_id = $1', [testUserId]);
    await client.query('DELETE FROM projects WHERE user_id = $1', [testUserId]);
    await client.query('DELETE FROM users WHERE id = $1', [testUserId]);

    logSuccess('Test data cleanup completed');
    return true;

  } catch (error) {
    logError(`Basic operations test failed: ${error.message}`);
    return false;
  }
}

async function getTableStats(client) {
  try {
    const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    logInfo('Database table statistics:');
    for (const row of result.rows) {
      log(`   ${row.tablename}: ${row.live_rows} rows (${row.inserts} inserts, ${row.updates} updates)`, 'blue');
    }

    return result.rows;
  } catch (error) {
    logWarning(`Could not retrieve table statistics: ${error.message}`);
    return [];
  }
}

async function checkPerformanceIndexes(client) {
  try {
    const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      AND idx_tup_read > 0
      ORDER BY idx_tup_read DESC
      LIMIT 10
    `);

    if (result.rows.length > 0) {
      logInfo('Most used indexes:');
      for (const row of result.rows) {
        log(`   ${row.indexname} on ${row.tablename}: ${row.idx_tup_read} reads`, 'blue');
      }
    } else {
      logInfo('No index usage statistics available yet (normal for new deployment)');
    }

    return result.rows;
  } catch (error) {
    logWarning(`Could not retrieve index statistics: ${error.message}`);
    return [];
  }
}

async function main() {
  logHeader('🔍 RAILWAY PRODUCTION REPAIR VERIFICATION');

  const client = await connectToDatabase();

  let allTestsPassed = true;
  let criticalTestsPassed = true;

  try {
    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 1: Verify Critical Tables Exist
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('📋 VERIFYING CRITICAL TABLES');

    const criticalTables = [
      ['users', 'Users'],
      ['projects', 'Projects'],
      ['content', 'Content'],
      ['content_metrics', 'Content Metrics'],
      ['post_schedules', 'Post Schedules'],
      ['ai_projects', 'AI Projects'],
      ['ai_generated_content', 'AI Generated Content'],
      ['sessions', 'Sessions']
    ];

    for (const [tableName, description] of criticalTables) {
      const exists = await verifyTableExists(client, tableName, description);
      if (!exists) {
        criticalTestsPassed = false;
        allTestsPassed = false;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 2: Verify Critical Columns Exist
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('🔧 VERIFYING CRITICAL COLUMNS');

    const criticalColumns = [
      ['users', 'password', 'Password (CRITICAL - fixes 502 errors)'],
      ['projects', 'category', 'Project Category'],
      ['projects', 'duration', 'Project Duration'],
      ['projects', 'content_frequency', 'Content Frequency'],
      ['projects', 'brand_voice', 'Brand Voice'],
      ['post_schedules', 'title', 'Schedule Title'],
      ['post_schedules', 'description', 'Schedule Description'],
      ['post_schedules', 'content_type', 'Schedule Content Type'],
      ['post_schedules', 'tone', 'Schedule Tone'],
      ['post_schedules', 'recurrence', 'Schedule Recurrence'],
      ['content', 'day_number', 'Content Day Number'],
      ['content', 'is_paused', 'Content Pause State'],
      ['content', 'content_version', 'Content Version']
    ];

    for (const [tableName, columnName, description] of criticalColumns) {
      const exists = await verifyColumnExists(client, tableName, columnName, description);
      if (!exists) {
        if (columnName === 'password') {
          criticalTestsPassed = false;
        }
        allTestsPassed = false;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 3: Verify Essential Indexes
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('📊 VERIFYING ESSENTIAL INDEXES');

    const essentialIndexes = [
      ['IDX_session_expire', 'Session Expiry'],
      ['idx_users_email', 'Users Email'],
      ['idx_content_user_id', 'Content User ID'],
      ['idx_projects_user_id', 'Projects User ID'],
      ['idx_post_schedules_scheduled_at', 'Post Schedules Scheduled At']
    ];

    for (const [indexName, description] of essentialIndexes) {
      await verifyIndexExists(client, indexName, description);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 4: Verify Unique Constraints
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('🔒 VERIFYING UNIQUE CONSTRAINTS');

    const uniqueConstraints = [
      ['users_email_key', 'Users Email Unique'],
      ['ai_engagement_patterns_platform_category_key', 'AI Engagement Patterns Unique'],
      ['niches_name_key', 'Niches Name Unique']
    ];

    for (const [constraintName, description] of uniqueConstraints) {
      await verifyConstraintExists(client, constraintName, description);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 5: Test Basic Database Operations
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('🧪 TESTING BASIC DATABASE OPERATIONS');

    const operationsTest = await testBasicOperations(client);
    if (!operationsTest) {
      criticalTestsPassed = false;
      allTestsPassed = false;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 6: Database Statistics and Performance
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('📈 DATABASE STATISTICS');

    await getTableStats(client);
    await checkPerformanceIndexes(client);

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 7: Final Validation Summary
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('📋 VERIFICATION SUMMARY');

    if (criticalTestsPassed) {
      logSuccess('All critical tests passed');
      logSuccess('Railway 502 errors should be eliminated');
      logSuccess('Database is ready for production use');
    } else {
      logError('Some critical tests failed');
      logError('Railway 502 errors may persist');
      logError('Manual intervention required');
    }

    if (allTestsPassed) {
      logSuccess('All tests passed - database is fully functional');
    } else {
      logWarning('Some non-critical tests failed - check logs above');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // STEP 8: Recommendations
    // ═══════════════════════════════════════════════════════════════════════════════
    
    logHeader('💡 RECOMMENDATIONS');

    if (criticalTestsPassed) {
      logInfo('✅ Deploy your application to Railway');
      logInfo('✅ Monitor application logs for any issues');
      logInfo('✅ Test all major features (login, projects, scheduling)');
      logInfo('✅ Monitor Railway metrics for performance');
    } else {
      logError('❌ Do not deploy until critical issues are resolved');
      logError('❌ Re-run the migration script');
      logError('❌ Check Railway database connectivity');
      logError('❌ Contact Railway support if issues persist');
    }

    console.log('');
    log('⏰ Verification completed at: ' + new Date().toISOString(), 'blue');
    console.log('');

    // Exit with appropriate code
    process.exit(criticalTestsPassed ? 0 : 1);

  } catch (error) {
    logError(`Verification failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the verification
main().catch(error => {
  console.error('Main function failed:', error);
  process.exit(1);
});