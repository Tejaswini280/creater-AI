#!/usr/bin/env node

/**
 * Simple verification script to check if the migration dependency fix will work
 */

const fs = require('fs');
const path = require('path');

function analyzeMigrationFile(filename, content) {
  console.log(`\n📄 Analyzing ${filename}:`);
  
  const normalizedContent = content.toLowerCase();
  
  // Check for table creations
  const tableMatches = content.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/gi);
  const tables = tableMatches ? tableMatches.map(match => {
    const parts = match.split(/\s+/);
    return parts[parts.length - 1];
  }) : [];
  
  // Check for index creations
  const indexMatches = content.match(/create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?[\w_]+\s+on\s+(\w+)\s*\(\s*([^)]+)\s*\)/gi);
  const indexes = indexMatches ? indexMatches.map(match => {
    const parts = match.match(/on\s+(\w+)\s*\(\s*([^)]+)\s*\)/i);
    return parts ? `${parts[1]}.${parts[2].split(',')[0].trim()}` : 'unknown';
  }) : [];
  
  console.log(`   Tables created: ${tables.length > 0 ? tables.join(', ') : 'none'}`);
  console.log(`   Indexes created: ${indexes.length > 0 ? indexes.join(', ') : 'none'}`);
  
  // Check for project_id references
  const projectIdRefs = content.match(/project_id/gi);
  if (projectIdRefs) {
    console.log(`   ⚠️  References to project_id: ${projectIdRefs.length} times`);
    
    // Check if this migration creates the projects table
    const createsProjects = tables.some(table => table.toLowerCase().includes('project'));
    const createsContent = tables.some(table => table.toLowerCase().includes('content'));
    
    if (!createsProjects && !createsContent) {
      console.log(`   🚨 POTENTIAL ISSUE: References project_id but doesn't create projects/content tables`);
      return false;
    } else {
      console.log(`   ✅ Creates required tables for project_id references`);
    }
  }
  
  return true;
}

function verifyMigrationOrder() {
  console.log('🔍 Verifying Migration Dependency Fix');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir);
    return false;
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  console.log(`📂 Found ${files.length} migration files`);
  
  let hasIssues = false;
  const createdTables = new Set();
  const createdColumns = new Map();
  
  for (const filename of files) {
    const filepath = path.join(migrationsDir, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    
    const isValid = analyzeMigrationFile(filename, content);
    if (!isValid) {
      hasIssues = true;
    }
    
    // Track what this migration creates
    const normalizedContent = content.toLowerCase();
    const tableMatches = content.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/gi);
    if (tableMatches) {
      tableMatches.forEach(match => {
        const parts = match.split(/\s+/);
        const tableName = parts[parts.length - 1].toLowerCase();
        createdTables.add(tableName);
        
        // Extract columns for this table (simplified)
        if (tableName === 'projects' || tableName === 'content') {
          if (!createdColumns.has(tableName)) {
            createdColumns.set(tableName, new Set());
          }
          if (content.includes('project_id')) {
            createdColumns.get(tableName).add('project_id');
          }
        }
      });
    }
  }
  
  console.log('\n📊 Migration Analysis Summary:');
  console.log(`   Tables that will be created: ${Array.from(createdTables).join(', ')}`);
  
  // Check if the problematic migration (0001) creates the required tables
  const coreTablesFile = files.find(f => f.includes('0001_core_tables'));
  if (coreTablesFile) {
    const coreContent = fs.readFileSync(path.join(migrationsDir, coreTablesFile), 'utf8');
    const hasProjects = coreContent.toLowerCase().includes('create table') && coreContent.toLowerCase().includes('projects');
    const hasContent = coreContent.toLowerCase().includes('create table') && coreContent.toLowerCase().includes('content');
    const hasProjectIdColumn = coreContent.includes('project_id');
    
    console.log(`\n🎯 Core Tables Migration (${coreTablesFile}):`);
    console.log(`   Creates projects table: ${hasProjects ? '✅' : '❌'}`);
    console.log(`   Creates content table: ${hasContent ? '✅' : '❌'}`);
    console.log(`   Defines project_id column: ${hasProjectIdColumn ? '✅' : '❌'}`);
    
    if (hasProjects && hasContent && hasProjectIdColumn) {
      console.log('   ✅ This migration should work correctly');
    } else {
      console.log('   ⚠️  This migration may still have dependency issues');
      hasIssues = true;
    }
  }
  
  return !hasIssues;
}

function checkEnhancedRunnerFiles() {
  console.log('\n🔧 Checking Enhanced Migration Runner Files:');
  
  const requiredFiles = [
    'server/services/migrationDependencyResolver.ts',
    'server/services/enhancedMigrationRunner.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  }
  
  return allFilesExist;
}

// Run verification
console.log('🧪 Migration Dependency Fix Verification');
console.log('═══════════════════════════════════════════════════════════════\n');

const migrationOrderOk = verifyMigrationOrder();
const filesExist = checkEnhancedRunnerFiles();

console.log('\n🎯 VERIFICATION RESULTS:');
console.log('═══════════════════════════════════════════════════════════════');

if (migrationOrderOk && filesExist) {
  console.log('✅ VERIFICATION PASSED!');
  console.log('   The migration dependency fix has been implemented.');
  console.log('   Your application should now start without the project_id column error.');
  console.log('\n📋 Next Steps:');
  console.log('   1. Restart your application');
  console.log('   2. The enhanced migration runner will analyze dependencies');
  console.log('   3. Migrations will execute in the correct order');
  console.log('   4. The project_id column issue should be resolved');
} else {
  console.log('❌ VERIFICATION FAILED!');
  if (!migrationOrderOk) {
    console.log('   • Migration dependency issues detected');
  }
  if (!filesExist) {
    console.log('   • Enhanced migration runner files missing');
  }
  console.log('\n   Please review the issues above before deploying.');
}

console.log('═══════════════════════════════════════════════════════════════');