const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 PHASE 4.2 ACCEPTANCE CRITERIA & TEST CASES VALIDATION');
console.log('=' .repeat(80));

// Test Results Tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🔍 Running Test: ${testName}`);
  
  try {
    const result = testFunction();
    if (result) {
      testResults.passed++;
      console.log(`✅ PASSED: ${testName}`);
    } else {
      testResults.failed++;
      console.log(`❌ FAILED: ${testName}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    console.log(`❌ ERROR: ${testName} - ${error.message}`);
  }
}

// Test 1: Database Connection
runTest('Database Connection Test', () => {
  try {
    const dbCheck = execSync('node -e "const { db } = require(\'./server/db\'); console.log(\'Database connected\')"', { encoding: 'utf8' });
    return dbCheck.includes('Database connected');
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
});

// Test 2: Schema Validation
runTest('Database Schema Validation', () => {
  try {
    const schemaPath = path.join(__dirname, 'shared', 'schema.ts');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found');
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const requiredTables = [
      'users', 'content', 'templates', 'notifications', 
      'aiGenerationTasks', 'contentMetrics', 'niches', 'socialAccounts'
    ];
    
    for (const table of requiredTables) {
      if (!schemaContent.includes(`export const ${table} = pgTable`)) {
        throw new Error(`Missing table: ${table}`);
      }
    }
    
    return true;
  } catch (error) {
    throw new Error(`Schema validation failed: ${error.message}`);
  }
});

// Test 3: Seeding Script Validation
runTest('Seeding Script Validation', () => {
  try {
    const seedingPath = path.join(__dirname, 'server', 'phase4-real-data-seeding.ts');
    if (!fs.existsSync(seedingPath)) {
      throw new Error('Seeding script not found');
    }
    
    const seedingContent = fs.readFileSync(seedingPath, 'utf8');
    const requiredFunctions = [
      'seedDatabase', 'generateAIContent', 'generateGeminiContent'
    ];
    
    for (const func of requiredFunctions) {
      if (!seedingContent.includes(`function ${func}`) && !seedingContent.includes(`async function ${func}`)) {
        throw new Error(`Missing function: ${func}`);
      }
    }
    
    return true;
  } catch (error) {
    throw new Error(`Seeding script validation failed: ${error.message}`);
  }
});

// Test 4: Data Seeding Execution
runTest('Data Seeding Execution', () => {
  try {
    console.log('   🌱 Executing data seeding...');
    const seedingOutput = execSync('node server/phase4-real-data-seeding.ts', { 
      encoding: 'utf8',
      timeout: 120000
    });
    
    const successIndicators = [
      'Phase 4 Real Data Seeding Completed Successfully',
      'Users: 50',
      'Templates: 50',
      'Content: 50',
      'AI Tasks: 50',
      'Notifications: 50'
    ];
    
    for (const indicator of successIndicators) {
      if (!seedingOutput.includes(indicator)) {
        throw new Error(`Missing success indicator: ${indicator}`);
      }
    }
    
    return true;
  } catch (error) {
    throw new Error(`Data seeding execution failed: ${error.message}`);
  }
});

// Test 5: Database Record Count Validation
runTest('Database Record Count Validation', () => {
  try {
    console.log('   📊 Validating record counts...');
    
    const validationScript = `
      const { db } = require('./server/db');
      const { users, content, templates, notifications, aiGenerationTasks, contentMetrics, niches, socialAccounts } = require('./shared/schema');
      
      async function validateCounts() {
        try {
          const userCount = await db.select().from(users);
          const contentCount = await db.select().from(content);
          const templateCount = await db.select().from(templates);
          const notificationCount = await db.select().from(notifications);
          const taskCount = await db.select().from(aiGenerationTasks);
          const nicheCount = await db.select().from(niches);
          const socialAccountCount = await db.select().from(socialAccounts);
          
          console.log('Record Counts:');
          console.log('Users:', userCount.length);
          console.log('Content:', contentCount.length);
          console.log('Templates:', templateCount.length);
          console.log('Notifications:', notificationCount.length);
          console.log('AI Tasks:', taskCount.length);
          console.log('Niches:', nicheCount.length);
          console.log('Social Accounts:', socialAccountCount.length);
          
          if (userCount.length < 50) throw new Error('Users count < 50');
          if (contentCount.length < 50) throw new Error('Content count < 50');
          if (templateCount.length < 50) throw new Error('Templates count < 50');
          if (notificationCount.length < 50) throw new Error('Notifications count < 50');
          if (taskCount.length < 50) throw new Error('AI Tasks count < 50');
          if (nicheCount.length < 20) throw new Error('Niches count < 20');
          if (socialAccountCount.length < 50) throw new Error('Social Accounts count < 50');
          
          console.log('All record counts validated successfully!');
        } catch (error) {
          console.error('Validation failed:', error.message);
          process.exit(1);
        }
      }
      
      validateCounts();
    `;
    
    fs.writeFileSync('temp-validation.js', validationScript);
    const validationOutput = execSync('node temp-validation.js', { encoding: 'utf8' });
    fs.unlinkSync('temp-validation.js');
    
    if (!validationOutput.includes('All record counts validated successfully!')) {
      throw new Error('Record count validation failed');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Database record count validation failed: ${error.message}`);
  }
});

// Final Results
console.log('\n' + '='.repeat(80));
console.log('📊 PHASE 4.2 ACCEPTANCE CRITERIA & TEST CASES RESULTS');
console.log('='.repeat(80));

console.log(`Total Tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

if (testResults.errors.length > 0) {
  console.log('\n❌ ERRORS ENCOUNTERED:');
  testResults.errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.test}: ${error.error}`);
  });
}

if (testResults.passed === testResults.total) {
  console.log('\n🎉 ALL PHASE 4.2 ACCEPTANCE CRITERIA & TEST CASES PASSED WITH 100% SUCCESS!');
  console.log('✅ Structured Dummy Data Seeding is fully functional and validated.');
  process.exit(0);
} else {
  console.log('\n❌ PHASE 4.2 ACCEPTANCE CRITERIA & TEST CASES FAILED!');
  console.log('🔧 Please fix the failed tests before proceeding.');
  process.exit(1);
}
