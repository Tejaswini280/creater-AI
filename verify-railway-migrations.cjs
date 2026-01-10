#!/usr/bin/env node

/**
 * Railway Migration Verification Script
 * Verifies all migrations are safe and ready for Railway deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Migration Verification Starting...\n');

// Configuration
const MIGRATION_DIR = './migrations';
const EXPECTED_MIGRATIONS = [
  '0000_railway_baseline_safe.sql',
  '0001_core_tables_idempotent.sql', 
  '0002_seed_data_with_conflicts.sql',
  '0003_additional_tables_safe.sql'
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkMigrationFiles() {
  log('📁 Checking migration files...', 'blue');
  
  const issues = [];
  
  for (const migration of EXPECTED_MIGRATIONS) {
    const filePath = path.join(MIGRATION_DIR, migration);
    
    if (!fs.existsSync(filePath)) {
      issues.push(`❌ Missing migration file: ${migration}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /DROP TABLE(?!\s+IF\s+EXISTS)/i, message: 'Contains unsafe DROP TABLE' },
      { pattern: /ALTER TABLE.*DROP COLUMN/i, message: 'Contains DROP COLUMN' },
      { pattern: /TRUNCATE/i, message: 'Contains TRUNCATE' },
      { pattern: /DELETE FROM.*WHERE/i, message: 'Contains conditional DELETE' }
    ];
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(content)) {
        issues.push(`⚠️  ${migration}: ${message}`);
      }
    }
    
    // Check for proper ON CONFLICT usage
    const onConflictMatches = content.match(/ON CONFLICT\s*\([^)]+\)/gi);
    if (onConflictMatches) {
      for (const match of onConflictMatches) {
        const column = match.match(/\(([^)]+)\)/)[1];
        
        // Check if there's a corresponding UNIQUE constraint
        const uniquePattern = new RegExp(`UNIQUE\\s*\\([^)]*${column}[^)]*\\)`, 'i');
        const constraintPattern = new RegExp(`ADD CONSTRAINT.*UNIQUE.*${column}`, 'i');
        
        if (!uniquePattern.test(content) && !constraintPattern.test(content)) {
          log(`⚠️  ${migration}: ON CONFLICT on '${column}' but no matching UNIQUE constraint found`, 'yellow');
        }
      }
    }
    
    log(`✅ ${migration} - OK`, 'green');
  }
  
  if (issues.length > 0) {
    log('\n❌ Migration Issues Found:', 'red');
    issues.forEach(issue => log(issue, 'red'));
    return false;
  }
  
  log('✅ All migration files are safe for Railway deployment\n', 'green');
  return true;
}

function analyzeOnConflictUsage() {
  log('🔍 Analyzing ON CONFLICT usage...', 'blue');
  
  const analysisResults = [];
  
  for (const migration of EXPECTED_MIGRATIONS) {
    const filePath = path.join(MIGRATION_DIR, migration);
    
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const onConflictMatches = content.match(/INSERT.*ON CONFLICT.*DO/gis);
    
    if (onConflictMatches) {
      analysisResults.push({
        file: migration,
        conflicts: onConflictMatches.length,
        details: onConflictMatches.map(match => {
          const lines = match.split('\n');
          return lines[0].substring(0, 80) + '...';
        })
      });
    }
  }
  
  if (analysisResults.length > 0) {
    log('📊 ON CONFLICT Usage Summary:', 'blue');
    analysisResults.forEach(result => {
      log(`  ${result.file}: ${result.conflicts} ON CONFLICT statements`, 'green');
      result.details.forEach(detail => {
        log(`    - ${detail}`, 'yellow');
      });
    });
  } else {
    log('ℹ️  No ON CONFLICT statements found', 'blue');
  }
  
  console.log();
}

function checkPostgreSQLCompatibility() {
  log('🐘 Checking PostgreSQL 15 compatibility...', 'blue');
  
  const compatibilityIssues = [];
  
  for (const migration of EXPECTED_MIGRATIONS) {
    const filePath = path.join(MIGRATION_DIR, migration);
    
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for PostgreSQL version-specific issues
    const issues = [
      { pattern: /CREATE INDEX CONCURRENTLY/i, message: 'CONCURRENTLY not supported in transactions' },
      { pattern: /\\$\\$/g, message: 'Uses $$ quoting (should be fine)' },
      { pattern: /GENERATED.*AS.*STORED/i, message: 'Generated columns (PostgreSQL 12+)' }
    ];
    
    for (const { pattern, message } of issues) {
      if (pattern.test(content)) {
        if (message.includes('not supported')) {
          compatibilityIssues.push(`❌ ${migration}: ${message}`);
        } else {
          log(`ℹ️  ${migration}: ${message}`, 'blue');
        }
      }
    }
  }
  
  if (compatibilityIssues.length > 0) {
    log('❌ PostgreSQL Compatibility Issues:', 'red');
    compatibilityIssues.forEach(issue => log(issue, 'red'));
    return false;
  }
  
  log('✅ All migrations are PostgreSQL 15 compatible\n', 'green');
  return true;
}

function generateMigrationOrder() {
  log('📋 Recommended Migration Order:', 'blue');
  
  EXPECTED_MIGRATIONS.forEach((migration, index) => {
    log(`  ${index + 1}. ${migration}`, 'green');
  });
  
  console.log();
}

function generateDeploymentInstructions() {
  log('🚀 Railway Deployment Instructions:', 'bold');
  
  const instructions = [
    '1. Backup your current Railway database (if any data exists)',
    '2. Run migrations in the specified order',
    '3. Verify each migration completes successfully',
    '4. Test application functionality',
    '5. Monitor for any constraint violations'
  ];
  
  instructions.forEach(instruction => {
    log(`   ${instruction}`, 'blue');
  });
  
  console.log();
  
  log('💡 Migration Commands:', 'bold');
  log('   # Connect to Railway PostgreSQL', 'blue');
  log('   railway connect', 'green');
  log('   # Or use direct connection string', 'blue');
  log('   psql $DATABASE_URL', 'green');
  log('   # Run each migration file', 'blue');
  log('   \\i migrations/0000_railway_baseline_safe.sql', 'green');
  log('   \\i migrations/0001_core_tables_idempotent.sql', 'green');
  log('   \\i migrations/0002_seed_data_with_conflicts.sql', 'green');
  log('   \\i migrations/0003_additional_tables_safe.sql', 'green');
  
  console.log();
}

function main() {
  try {
    log('🔧 Railway PostgreSQL Migration Verification', 'bold');
    log('=' .repeat(50), 'blue');
    
    const filesOk = checkMigrationFiles();
    const compatibilityOk = checkPostgreSQLCompatibility();
    
    analyzeOnConflictUsage();
    generateMigrationOrder();
    
    if (filesOk && compatibilityOk) {
      log('🎉 SUCCESS: All migrations are ready for Railway deployment!', 'green');
      generateDeploymentInstructions();
    } else {
      log('❌ FAILED: Please fix the issues above before deploying', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Error during verification: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();