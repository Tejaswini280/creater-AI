#!/usr/bin/env node

/**
 * Test Current Migrations for ON CONFLICT Issues
 * This script tests if the current migrations actually have the ON CONFLICT problems
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Current Migration Files for ON CONFLICT Issues...\n');

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

function analyzeOnConflictInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { hasIssues: false, message: 'File not found' };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Find all ON CONFLICT statements
  const onConflictRegex = /INSERT[\s\S]*?ON CONFLICT\s*\(([^)]+)\)[\s\S]*?DO\s+(NOTHING|UPDATE)/gi;
  const matches = [...content.matchAll(onConflictRegex)];
  
  if (matches.length === 0) {
    return { hasIssues: false, message: 'No ON CONFLICT statements found' };
  }
  
  log(`📄 Found ${matches.length} ON CONFLICT statements in ${path.basename(filePath)}`, 'blue');
  
  for (const match of matches) {
    const conflictColumns = match[1].trim();
    const action = match[2];
    
    log(`  🔍 ON CONFLICT (${conflictColumns}) DO ${action}`, 'yellow');
    
    // Check if there's a corresponding UNIQUE constraint
    const hasUniqueConstraint = checkUniqueConstraint(content, conflictColumns);
    
    if (hasUniqueConstraint) {
      log(`    ✅ UNIQUE constraint found for: ${conflictColumns}`, 'green');
    } else {
      log(`    ❌ NO UNIQUE constraint found for: ${conflictColumns}`, 'red');
      issues.push(`Missing UNIQUE constraint for: ${conflictColumns}`);
    }
  }
  
  return { 
    hasIssues: issues.length > 0, 
    issues: issues,
    conflictCount: matches.length 
  };
}

function checkUniqueConstraint(content, conflictColumns) {
  // Clean up the conflict columns
  const columns = conflictColumns.split(',').map(col => col.trim());
  
  // Check for inline UNIQUE constraint
  if (columns.length === 1) {
    const singleColumnPattern = new RegExp(`${columns[0]}\\s+[^,]*?UNIQUE`, 'i');
    if (singleColumnPattern.test(content)) {
      return true;
    }
  }
  
  // Check for table-level UNIQUE constraint
  const multiColumnPattern = new RegExp(`UNIQUE\\s*\\([^)]*${conflictColumns.replace(/,/g, '[^)]*,')}[^)]*\\)`, 'i');
  if (multiColumnPattern.test(content)) {
    return true;
  }
  
  // Check for ALTER TABLE ADD CONSTRAINT UNIQUE
  const alterTablePattern = new RegExp(`ADD CONSTRAINT.*UNIQUE.*\\([^)]*${conflictColumns}[^)]*\\)`, 'i');
  if (alterTablePattern.test(content)) {
    return true;
  }
  
  return false;
}

function main() {
  const migrationFiles = [
    'migrations/0001_comprehensive_schema_fix.sql',
    'migrations/9999_production_repair_idempotent.sql',
    'migrations/9999_critical_form_database_mapping_fix.sql'
  ];
  
  let totalIssues = 0;
  let totalConflicts = 0;
  
  for (const file of migrationFiles) {
    const result = analyzeOnConflictInFile(file);
    
    if (result.conflictCount) {
      totalConflicts += result.conflictCount;
    }
    
    if (result.hasIssues) {
      log(`❌ ${path.basename(file)}: ${result.issues.length} issues found`, 'red');
      result.issues.forEach(issue => log(`   - ${issue}`, 'red'));
      totalIssues += result.issues.length;
    } else if (result.conflictCount > 0) {
      log(`✅ ${path.basename(file)}: All ON CONFLICT statements have matching constraints`, 'green');
    } else {
      log(`ℹ️  ${path.basename(file)}: ${result.message}`, 'blue');
    }
    
    console.log();
  }
  
  // Summary
  log('📊 SUMMARY:', 'bold');
  log(`   Total ON CONFLICT statements: ${totalConflicts}`, 'blue');
  log(`   Total constraint issues: ${totalIssues}`, totalIssues > 0 ? 'red' : 'green');
  
  if (totalIssues === 0 && totalConflicts > 0) {
    log('\n🎉 RESULT: Current migrations appear to be CORRECT!', 'green');
    log('   All ON CONFLICT statements have matching UNIQUE constraints.', 'green');
    log('   The error might be occurring for a different reason.', 'yellow');
  } else if (totalIssues > 0) {
    log('\n❌ RESULT: Current migrations have constraint issues!', 'red');
    log('   These need to be fixed before deployment.', 'red');
  } else {
    log('\n ℹ️ RESULT: No ON CONFLICT statements found in current migrations.', 'blue');
  }
}

main();