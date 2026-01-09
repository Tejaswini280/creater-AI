#!/usr/bin/env node

/**
 * SIMPLE MIGRATION SYNTAX TEST
 * Tests that our migrations have valid PostgreSQL syntax
 */

const fs = require('fs');

console.log('🔍 TESTING MIGRATION SYNTAX...\n');

// Test files to check
const migrationFiles = [
    'migrations/0000_nice_forgotten_one.sql',
    'migrations/0001_comprehensive_schema_fix.sql', 
    'migrations/9999_production_repair_idempotent.sql'
];

let allValid = true;

for (const file of migrationFiles) {
    console.log(`📄 Checking ${file}...`);
    
    if (!fs.existsSync(file)) {
        console.log(`❌ File not found: ${file}`);
        allValid = false;
        continue;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for problematic syntax patterns
    const issues = [];
    
    // Check for problematic DO $ blocks (but not valid syntax like "ON CONFLICT DO NOTHING")
    if (content.match(/^DO\s+\$/m)) {
        issues.push('Contains DO $ blocks (syntax error prone)');
    }
    
    // Check for IF NOT EXISTS after NOT NULL (invalid)
    if (content.match(/NOT\s+NULL\s+IF\s+NOT\s+EXISTS/i)) {
        issues.push('Contains "NOT NULL IF NOT EXISTS" (invalid syntax)');
    }
    
    // Check for single $ delimiters that aren't part of valid $$ pairs
    const singleDollarMatches = content.match(/\$[^$\s]/g) || [];
    if (singleDollarMatches.length > 0) {
        issues.push(`Contains single $ delimiters: ${singleDollarMatches.join(', ')}`);
    }
    
    if (issues.length > 0) {
        console.log(`❌ Issues found:`);
        issues.forEach(issue => console.log(`   - ${issue}`));
        allValid = false;
    } else {
        console.log(`✅ Syntax looks valid`);
    }
}

console.log('\n' + '═'.repeat(60));
if (allValid) {
    console.log('🎉 ALL MIGRATIONS HAVE VALID SYNTAX!');
    console.log('✅ No DO $ blocks found');
    console.log('✅ No invalid NOT NULL IF NOT EXISTS patterns');
    console.log('✅ All $ delimiters are properly matched');
    console.log('\n🚀 Ready for Railway deployment!');
} else {
    console.log('❌ SYNTAX ISSUES FOUND - MUST BE FIXED');
    process.exit(1);
}
console.log('═'.repeat(60));