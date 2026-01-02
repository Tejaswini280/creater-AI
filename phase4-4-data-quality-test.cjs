const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message }
    };
  }
}

// Authentication setup
async function setupAuth() {
  console.log('🔐 Setting up authentication...');
  
  // Register a test user
  const registerData = {
    email: 'test-data-quality@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  const registerResult = await makeRequest('POST', '/api/auth/register', registerData);
  if (!registerResult.success) {
    console.log('User already exists, attempting login...');
  }
  
  // Login to get token
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: registerData.email,
    password: registerData.password
  });
  
  if (loginResult.success && loginResult.data.accessToken) {
    authToken = loginResult.data.accessToken;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed:', loginResult.data);
    return false;
  }
}

// Phase 4.4: Data Quality & Validation Framework Tests

async function testInputValidation() {
  console.log('\n🔍 Testing Input Validation for All Data Entry Points...');
  
  // Test 1: User data validation - Invalid email
  const invalidUserData = {
    email: 'invalid-email',
    password: 'weak',
    firstName: '',
    lastName: 'User'
  };
  
  const userValidationResult = await makeRequest('POST', '/api/validation/user', invalidUserData, authToken);
  const hasUserValidation = userValidationResult.status === 400 && 
    userValidationResult.data.errors && 
    userValidationResult.data.errors.length > 0;
  
  logTest('Input validation for user data entry', hasUserValidation,
    hasUserValidation ? '' : `Expected 400 with validation errors, got ${userValidationResult.status}`);
  
  // Test 2: Content data validation - Invalid platform
  const invalidContentData = {
    title: 'Test Content',
    description: 'Test description',
    platform: 'invalid-platform',
    contentType: 'video'
  };
  
  const contentValidationResult = await makeRequest('POST', '/api/validation/content', invalidContentData, authToken);
  const hasContentValidation = contentValidationResult.status === 400 && 
    contentValidationResult.data.errors && 
    contentValidationResult.data.errors.length > 0;
  
  logTest('Input validation for content data entry', hasContentValidation,
    hasContentValidation ? '' : `Expected 400 with validation errors, got ${contentValidationResult.status}`);
  
  // Test 3: Template data validation - Invalid category
  const invalidTemplateData = {
    title: 'Test Template',
    description: 'Test template description',
    category: 'invalid-category',
    type: 'Test Type'
  };
  
  const templateValidationResult = await makeRequest('POST', '/api/validation/template', invalidTemplateData, authToken);
  const hasTemplateValidation = templateValidationResult.status === 400 && 
    templateValidationResult.data.errors && 
    templateValidationResult.data.errors.length > 0;
  
  logTest('Input validation for template data entry', hasTemplateValidation,
    hasTemplateValidation ? '' : `Expected 400 with validation errors, got ${templateValidationResult.status}`);
  
  // Test 4: Niche data validation - Invalid difficulty
  const invalidNicheData = {
    name: 'Test Niche',
    category: 'Test Category',
    difficulty: 'invalid-difficulty',
    profitability: 'high'
  };
  
  const nicheValidationResult = await makeRequest('POST', '/api/validation/niche', invalidNicheData, authToken);
  const hasNicheValidation = nicheValidationResult.status === 400 && 
    nicheValidationResult.data.errors && 
    nicheValidationResult.data.errors.length > 0;
  
  logTest('Input validation for niche data entry', hasNicheValidation,
    hasNicheValidation ? '' : `Expected 400 with validation errors, got ${nicheValidationResult.status}`);
}

async function testDataSanitization() {
  console.log('\n🧹 Testing Data Sanitization and Cleaning Procedures...');
  
  // Test 1: XSS prevention in content (should reject malicious content)
  const maliciousContentData = {
    title: '<script>alert("xss")</script>',
    description: 'Content with <iframe>malicious</iframe> content',
    platform: 'youtube',
    contentType: 'video',
    tags: ['<script>alert("tag")</script>', 'normal-tag']
  };
  
  const sanitizationResult = await makeRequest('POST', '/api/validation/content', maliciousContentData, authToken);
  const hasSanitization = sanitizationResult.status === 400 && 
    sanitizationResult.data.errors &&
    sanitizationResult.data.errors.length > 0;
  
  logTest('Data sanitization and cleaning procedures', hasSanitization,
    hasSanitization ? '' : 'Malicious content not properly rejected');
  
  // Test 2: Email sanitization (should accept and sanitize valid data)
  const emailData = {
    email: 'test@example.com',
    password: 'TestPass123!',
    firstName: '  Test  ',
    lastName: '  User  '
  };
  
  const emailSanitizationResult = await makeRequest('POST', '/api/validation/user', emailData, authToken);
  const hasEmailSanitization = emailSanitizationResult.success && 
    emailSanitizationResult.data.data &&
    emailSanitizationResult.data.data.email === 'test@example.com' &&
    emailSanitizationResult.data.data.firstName === 'Test' &&
    emailSanitizationResult.data.data.lastName === 'User';
  
  logTest('Email and string sanitization', hasEmailSanitization,
    hasEmailSanitization ? '' : 'Email/string sanitization not working');
  
  // Test 3: Tag sanitization (should reject malicious tags)
  const tagData = {
    title: 'Test Template',
    description: 'Test template description',
    category: 'video',
    type: 'Test Type',
    tags: ['  tag1  ', '<script>malicious</script>', 'tag2', '', '   ']
  };
  
  const tagSanitizationResult = await makeRequest('POST', '/api/validation/template', tagData, authToken);
  const hasTagSanitization = tagSanitizationResult.status === 400 && 
    tagSanitizationResult.data.errors &&
    tagSanitizationResult.data.errors.length > 0;
  
  logTest('Tag sanitization and validation', hasTagSanitization,
    hasTagSanitization ? '' : 'Malicious tags not properly rejected');
}

async function testDataQualityMonitoring() {
  console.log('\n📊 Testing Data Quality Monitoring and Alerting...');
  
  // Test 1: Data quality validation
  const qualityValidationResult = await makeRequest('POST', '/api/data-quality/validate', {}, authToken);
  const hasQualityMonitoring = qualityValidationResult.success && 
    qualityValidationResult.data.overallQualityScore !== undefined &&
    qualityValidationResult.data.metrics &&
    Object.keys(qualityValidationResult.data.metrics).length > 0;
  
  logTest('Data quality monitoring and alerting', hasQualityMonitoring,
    hasQualityMonitoring ? '' : 'Quality monitoring not working');
  
  // Test 2: Data quality metrics retrieval
  const metricsResult = await makeRequest('GET', '/api/data-quality/metrics', null, authToken);
  const hasMetricsRetrieval = metricsResult.success && 
    metricsResult.data.metrics &&
    Object.keys(metricsResult.data.metrics).length > 0;
  
  logTest('Data quality metrics retrieval', hasMetricsRetrieval,
    hasMetricsRetrieval ? '' : 'Metrics retrieval not working');
  
  // Test 3: Data quality issues retrieval
  const issuesResult = await makeRequest('GET', '/api/data-quality/issues', null, authToken);
  const hasIssuesRetrieval = issuesResult.success && 
    issuesResult.data.issues !== undefined &&
    issuesResult.data.totalIssues !== undefined;
  
  logTest('Data quality issues retrieval', hasIssuesRetrieval,
    hasIssuesRetrieval ? '' : 'Issues retrieval not working');
  
  // Test 4: Data quality health check
  const healthResult = await makeRequest('GET', '/api/data-quality/health', null, authToken);
  const hasHealthCheck = healthResult.success && 
    healthResult.data.status &&
    healthResult.data.overallQualityScore !== undefined &&
    healthResult.data.criticalIssues !== undefined;
  
  logTest('Data quality health check', hasHealthCheck,
    hasHealthCheck ? '' : 'Health check not working');
}

async function testDataBackupRecovery() {
  console.log('\n💾 Testing Data Backup and Recovery Procedures...');
  
  // Test 1: Create backup
  const backupResult = await makeRequest('POST', '/api/data/backup', {}, authToken);
  const hasBackupCreation = backupResult.success && 
    backupResult.data.backupFile &&
    backupResult.data.message === 'Backup created successfully';
  
  logTest('Data backup creation', hasBackupCreation,
    hasBackupCreation ? '' : 'Backup creation failed');
  
  // Test 2: List backups
  const listBackupsResult = await makeRequest('GET', '/api/data/backups', null, authToken);
  const hasBackupListing = listBackupsResult.success && 
    listBackupsResult.data.backups &&
    Array.isArray(listBackupsResult.data.backups);
  
  logTest('Data backup listing', hasBackupListing,
    hasBackupListing ? '' : 'Backup listing failed');
  
  // Test 3: Backup file exists
  let hasBackupFile = false;
  if (hasBackupCreation && hasBackupListing) {
    const backupFile = backupResult.data.backupFile;
    const backupPath = path.join(process.cwd(), 'backups', backupFile);
    hasBackupFile = fs.existsSync(backupPath);
  }
  
  logTest('Backup file exists on disk', hasBackupFile,
    hasBackupFile ? '' : 'Backup file not found on disk');
  
  // Note: We won't test actual restoration in this test to avoid data loss
  logTest('Data backup and recovery procedures', hasBackupCreation && hasBackupListing && hasBackupFile,
    'Backup system functional (restoration tested separately)');
}

async function testDataMigrationVersioning() {
  console.log('\n🔄 Testing Data Migration and Versioning System...');
  
  // Test 1: Get migrations
  const migrationsResult = await makeRequest('GET', '/api/migrations', null, authToken);
  const hasMigrationSystem = migrationsResult.success && 
    migrationsResult.data.currentVersion !== undefined &&
    migrationsResult.data.migrations &&
    Array.isArray(migrationsResult.data.migrations);
  
  logTest('Data migration and versioning system', hasMigrationSystem,
    hasMigrationSystem ? '' : 'Migration system not working');
  
  // Test 2: Migration manager functionality
  const hasMigrationManager = migrationsResult.success && 
    typeof migrationsResult.data.currentVersion === 'number';
  
  logTest('Migration manager functionality', hasMigrationManager,
    hasMigrationManager ? '' : 'Migration manager not working');
}

async function testDataAuditTrails() {
  console.log('\n📝 Testing Data Audit Trails and Logging...');
  
  // Test 1: Get audit logs
  const auditLogsResult = await makeRequest('GET', '/api/audit/logs', null, authToken);
  const hasAuditLogs = auditLogsResult.success && 
    auditLogsResult.data.logs &&
    Array.isArray(auditLogsResult.data.logs) &&
    auditLogsResult.data.totalLogs !== undefined;
  
  logTest('Data audit trails and logging', hasAuditLogs,
    hasAuditLogs ? '' : 'Audit logs not working');
  
  // Test 2: Clear audit logs
  const clearLogsResult = await makeRequest('DELETE', '/api/audit/logs', null, authToken);
  const hasClearLogs = clearLogsResult.success && 
    clearLogsResult.data.message === 'Audit logs cleared';
  
  logTest('Audit logs clearing functionality', hasClearLogs,
    hasClearLogs ? '' : 'Clear logs not working');
  
  // Test 3: Filtered audit logs
  const filteredLogsResult = await makeRequest('GET', '/api/audit/logs?table=users', null, authToken);
  const hasFilteredLogs = filteredLogsResult.success && 
    filteredLogsResult.data.logs &&
    Array.isArray(filteredLogsResult.data.logs);
  
  logTest('Filtered audit logs retrieval', hasFilteredLogs,
    hasFilteredLogs ? '' : 'Filtered logs not working');
}

async function testDataRetentionCleanup() {
  console.log('\n🗑️ Testing Data Retention and Cleanup Policies...');
  
  // Test 1: Data cleanup
  const cleanupResult = await makeRequest('POST', '/api/data/cleanup', {}, authToken);
  const hasDataCleanup = cleanupResult.success && 
    cleanupResult.data.result &&
    cleanupResult.data.result.deleted !== undefined &&
    cleanupResult.data.result.errors !== undefined;
  
  logTest('Data retention and cleanup policies', hasDataCleanup,
    hasDataCleanup ? '' : 'Data cleanup not working');
  
  // Test 2: Cleanup result structure
  const hasCleanupStructure = cleanupResult.success && 
    typeof cleanupResult.data.result.deleted === 'number' &&
    typeof cleanupResult.data.result.errors === 'number';
  
  logTest('Cleanup result structure validation', hasCleanupStructure,
    hasCleanupStructure ? '' : 'Cleanup result structure invalid');
}

async function testDataExportImport() {
  console.log('\n📤 Testing Data Export and Import Functionality...');
  
  // Test 1: Export data (JSON format)
  const exportJsonResult = await makeRequest('GET', '/api/data/export/users?format=json', null, authToken);
  const hasJsonExport = exportJsonResult.success && 
    exportJsonResult.data &&
    Array.isArray(exportJsonResult.data);
  
  logTest('Data export functionality (JSON)', hasJsonExport,
    hasJsonExport ? '' : 'JSON export not working');
  
  // Test 2: Export data (CSV format)
  const exportCsvResult = await makeRequest('GET', '/api/data/export/users?format=csv', null, authToken);
  const hasCsvExport = exportCsvResult.success && 
    exportCsvResult.data &&
    typeof exportCsvResult.data === 'string' &&
    exportCsvResult.data.includes(',');
  
  logTest('Data export functionality (CSV)', hasCsvExport,
    hasCsvExport ? '' : 'CSV export not working');
  
  // Test 3: Import data validation
  const testImportData = [
    {
      id: `import-${Date.now()}`,
      email: `test-import-${Date.now()}@example.com`,
      password: 'TestPass123!',
      firstName: 'Import',
      lastName: 'Test'
    }
  ];
  
  const importResult = await makeRequest('POST', '/api/data/import/users', {
    data: testImportData,
    format: 'json'
  }, authToken);
  
  const hasDataImport = importResult.success && 
    importResult.data.inserted &&
    typeof importResult.data.inserted === 'number' &&
    importResult.data.inserted > 0;
  
  logTest('Data import functionality', hasDataImport,
    hasDataImport ? '' : 'Data import not working');
  
  // Test 4: Export/Import error handling
  const invalidImportResult = await makeRequest('POST', '/api/data/import/users', {
    data: 'invalid-data',
    format: 'json'
  }, authToken);
  
  const hasErrorHandling = !invalidImportResult.success && 
    invalidImportResult.status === 400;
  
  logTest('Data export/import error handling', hasErrorHandling,
    hasErrorHandling ? '' : 'Error handling not working');
}

async function testValidationFramework() {
  console.log('\n✅ Testing Validation Framework Rules...');
  
  // Test 1: User data validation rules
  const validUserData = {
    email: 'valid@example.com',
    password: 'ValidPass123!',
    firstName: 'Valid',
    lastName: 'User'
  };
  
  const userValidationResult = await makeRequest('POST', '/api/validation/user', validUserData, authToken);
  const hasUserValidationRules = userValidationResult.success && 
    userValidationResult.data.data &&
    userValidationResult.data.data.email === 'valid@example.com';
  
  logTest('User data validation rules', hasUserValidationRules,
    hasUserValidationRules ? '' : 'User validation rules not working');
  
  // Test 2: Content data validation rules
  const validContentData = {
    title: 'Valid Content Title',
    description: 'This is a valid content description with sufficient length',
    platform: 'youtube',
    contentType: 'video',
    tags: ['tag1', 'tag2', 'tag3']
  };
  
  const contentValidationResult = await makeRequest('POST', '/api/validation/content', validContentData, authToken);
  const hasContentValidationRules = contentValidationResult.success && 
    contentValidationResult.data.data &&
    contentValidationResult.data.data.platform === 'youtube';
  
  logTest('Content data validation rules', hasContentValidationRules,
    hasContentValidationRules ? '' : 'Content validation rules not working');
  
  // Test 3: Template data validation rules
  const validTemplateData = {
    title: 'Valid Template',
    description: 'This is a valid template description with sufficient length for validation',
    category: 'video',
    type: 'Video Template',
    rating: 4.5,
    downloads: 100
  };
  
  const templateValidationResult = await makeRequest('POST', '/api/validation/template', validTemplateData, authToken);
  const hasTemplateValidationRules = templateValidationResult.success && 
    templateValidationResult.data.data &&
    templateValidationResult.data.data.category === 'video';
  
  logTest('Template data validation rules', hasTemplateValidationRules,
    hasTemplateValidationRules ? '' : 'Template validation rules not working');
  
  // Test 4: Analytics data validation rules
  const validNicheData = {
    name: 'Valid Niche',
    category: 'Technology',
    difficulty: 'medium',
    profitability: 'high',
    keywords: ['tech', 'innovation', 'startup']
  };
  
  const nicheValidationResult = await makeRequest('POST', '/api/validation/niche', validNicheData, authToken);
  const hasNicheValidationRules = nicheValidationResult.success && 
    nicheValidationResult.data.data &&
    nicheValidationResult.data.data.difficulty === 'medium';
  
  logTest('Analytics data validation rules', hasNicheValidationRules,
    hasNicheValidationRules ? '' : 'Analytics validation rules not working');
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Phase 4.4: Data Quality & Validation Framework Tests');
  console.log('=' .repeat(80));
  
  // Setup authentication
  const authSuccess = await setupAuth();
  if (!authSuccess) {
    console.log('❌ Authentication failed. Cannot proceed with tests.');
    return;
  }
  
  // Run all test suites
  await testInputValidation();
  await testDataSanitization();
  await testDataQualityMonitoring();
  await testDataBackupRecovery();
  await testDataMigrationVersioning();
  await testDataAuditTrails();
  await testDataRetentionCleanup();
  await testDataExportImport();
  await testValidationFramework();
  
  // Print results
  console.log('\n' + '=' .repeat(80));
  console.log('📊 PHASE 4.4 TEST RESULTS');
  console.log('=' .repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  // Check if all tests passed
  const allTestsPassed = testResults.failed === 0;
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL PHASE 4.4 TESTS PASSED! 🎉');
    console.log('✅ Data Quality & Validation Framework is fully functional');
    console.log('✅ All acceptance criteria met');
    console.log('✅ All test cases passed with 100% success');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Please review the failed tests above and fix the issues.');
  }
  
  // Save detailed results
  const resultsFile = 'phase4-4-test-results.json';
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
  
  return allTestsPassed;
}

// Run the tests
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
