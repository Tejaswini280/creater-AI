/**
 * Comprehensive Test Suite for Enhanced New Project Implementation
 * Tests all major features: Project Creation, AI Calendar, Dashboard, Integrations, AI Enhancement
 */

const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'test-token';

// Test configuration
const testConfig = {
  timeout: 30000,
  retries: 3
};

// Helper function for API requests
async function apiRequest(method, endpoint, data = null, token = TEST_USER_TOKEN) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined
    },
    timeout: testConfig.timeout
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.data = data;
  }

  return axios(config);
}

// Test data
const testProjectData = {
  name: 'AI Fitness Content Series',
  description: 'Comprehensive fitness content with AI-generated posts',
  contentType: 'fitness',
  channelTypes: ['instagram', 'youtube', 'tiktok'],
  category: 'Workout Routines',
  duration: '1week',
  contentFrequency: 'daily',
  calendarPreference: 'ai-generated',
  aiEnhancement: true,
  targetAudience: 'Young professionals aged 25-35',
  tags: ['fitness', 'workout', 'health'],
  isPublic: false,
  notificationsEnabled: true,
  status: 'draft'
};

const testIntegrationData = {
  youtube: { connected: true, accountName: 'Fitness Channel', status: 'active' },
  instagram: { connected: true, accountName: 'fitness_guru', status: 'active' },
  tiktok: { connected: false, accountName: '', status: 'disconnected' },
  facebook: { connected: false, accountName: '', status: 'disconnected' },
  linkedin: { connected: true, accountName: 'Fitness Pro', status: 'active' }
};

// Test suites
class EnhancedProjectTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    this.createdProjectId = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      info: '\x1b[36m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runTest(testName, testFunction) {
    this.log(`Running test: ${testName}`, 'info');

    try {
      const result = await testFunction();
      if (result === true || result === undefined) {
        this.testResults.passed++;
        this.testResults.tests.push({ name: testName, status: 'passed' });
        this.log(`✅ ${testName} - PASSED`, 'success');
        return true;
      } else {
        this.testResults.failed++;
        this.testResults.tests.push({ name: testName, status: 'failed', error: result });
        this.log(`❌ ${testName} - FAILED: ${result}`, 'error');
        return false;
      }
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({
        name: testName,
        status: 'failed',
        error: error.message
      });
      this.log(`❌ ${testName} - ERROR: ${error.message}`, 'error');
      return false;
    }
  }

  async testEnhancedProjectCreation() {
    this.log('🧪 Testing Enhanced Project Creation', 'info');

    try {
      const response = await apiRequest('POST', '/api/projects/enhanced', testProjectData);

      if (response.status !== 201) {
        return `Expected status 201, got ${response.status}`;
      }

      if (!response.data.success) {
        return `Project creation failed: ${response.data.message}`;
      }

      if (!response.data.project.id) {
        return 'Project creation response missing project ID';
      }

      // Validate enhanced fields are stored
      const project = response.data.project;
      if (project.metadata.contentType !== testProjectData.contentType) {
        return 'Content type not stored correctly';
      }

      if (!Array.isArray(project.metadata.channelTypes) ||
          project.metadata.channelTypes.length !== testProjectData.channelTypes.length) {
        return 'Channel types not stored correctly';
      }

      this.createdProjectId = project.id;
      this.log(`📝 Created enhanced project with ID: ${this.createdProjectId}`, 'success');

      return true;
    } catch (error) {
      return `API request failed: ${error.message}`;
    }
  }

  async testAIContentEnhancement() {
    this.log('🤖 Testing AI Content Enhancement', 'info');

    try {
      const testText = 'Learn about fitness and stay healthy';
      const context = {
        contentType: 'fitness',
        platform: 'instagram'
      };

      const response = await apiRequest('POST', '/api/ai/enhance-content', {
        text: testText,
        context
      });

      if (response.status !== 200) {
        return `Expected status 200, got ${response.status}`;
      }

      if (!response.data.success) {
        return `AI enhancement failed: ${response.data.message}`;
      }

      if (!response.data.enhancedText) {
        return 'Enhanced text not returned';
      }

      if (response.data.enhancedText.length <= testText.length) {
        return 'Enhanced text should be longer than original';
      }

      if (!Array.isArray(response.data.improvements)) {
        return 'Improvements array not returned';
      }

      this.log(`✨ AI enhanced: "${testText}" → "${response.data.enhancedText}"`, 'success');

      return true;
    } catch (error) {
      return `API request failed: ${error.message}`;
    }
  }

  async testIntegrationSetup() {
    this.log('🔗 Testing Integration Setup', 'info');

    if (!this.createdProjectId) {
      return 'No project ID available - skipping integration test';
    }

    try {
      const response = await apiRequest('POST', `/api/projects/${this.createdProjectId}/integrations`, {
        integrations: testIntegrationData
      });

      if (response.status !== 200) {
        return `Expected status 200, got ${response.status}`;
      }

      if (!response.data.success) {
        return `Integration setup failed: ${response.data.message}`;
      }

      this.log(`🔗 Set up integrations for project ${this.createdProjectId}`, 'success');

      return true;
    } catch (error) {
      return `API request failed: ${error.message}`;
    }
  }

  async testAICalendarGeneration() {
    this.log('📅 Testing AI Calendar Generation', 'info');

    if (!this.createdProjectId) {
      return 'No project ID available - skipping calendar test';
    }

    try {
      const calendarData = {
        contentType: testProjectData.contentType,
        channelTypes: testProjectData.channelTypes,
        category: testProjectData.category,
        duration: 7, // 1 week
        contentFrequency: testProjectData.contentFrequency,
        startDate: new Date().toISOString(),
        aiEnhancement: testProjectData.aiEnhancement
      };

      const response = await apiRequest('POST', `/api/projects/${this.createdProjectId}/ai-calendar`, calendarData);

      if (response.status !== 200) {
        return `Expected status 200, got ${response.status}`;
      }

      if (!response.data.success) {
        return `AI calendar generation failed: ${response.data.message}`;
      }

      if (!response.data.calendar.posts || !Array.isArray(response.data.calendar.posts)) {
        return 'Calendar posts not returned correctly';
      }

      if (response.data.calendar.posts.length !== 7) {
        return `Expected 7 posts for 1 week, got ${response.data.calendar.posts.length}`;
      }

      this.log(`📅 Generated AI calendar with ${response.data.calendar.posts.length} posts`, 'success');

      return true;
    } catch (error) {
      return `API request failed: ${error.message}`;
    }
  }

  async testProjectDashboard() {
    this.log('📊 Testing Project Dashboard', 'info');

    if (!this.createdProjectId) {
      return 'No project ID available - skipping dashboard test';
    }

    try {
      const response = await apiRequest('GET', `/api/projects/${this.createdProjectId}/dashboard`);

      if (response.status !== 200) {
        return `Expected status 200, got ${response.status}`;
      }

      if (!response.data.success) {
        return `Dashboard fetch failed: ${response.data.message}`;
      }

      const dashboard = response.data.dashboard;

      if (!dashboard.project) {
        return 'Project data not included in dashboard';
      }

      if (!dashboard.statistics) {
        return 'Statistics not included in dashboard';
      }

      if (!Array.isArray(dashboard.socialAccounts)) {
        return 'Social accounts not returned as array';
      }

      this.log(`📊 Dashboard loaded with ${dashboard.socialAccounts.length} social accounts`, 'success');

      return true;
    } catch (error) {
      return `API request failed: ${error.message}`;
    }
  }

  async testRegularProjectCreation() {
    this.log('📝 Testing Regular Project Creation (Backward Compatibility)', 'info');

    try {
      const regularProjectData = {
        name: 'Regular Test Project',
        description: 'Testing backward compatibility',
        type: 'video',
        platform: 'youtube',
        targetAudience: 'General audience',
        estimatedDuration: '2-4 hours',
        tags: ['test', 'compatibility'],
        isPublic: false
      };

      const response = await apiRequest('POST', '/api/projects', regularProjectData);

      if (response.status !== 201) {
        return `Expected status 201, got ${response.status}`;
      }

      if (!response.data.success) {
        return `Regular project creation failed: ${response.data.message}`;
      }

      this.log(`📝 Regular project created successfully`, 'success');

      return true;
    } catch (error) {
      return `API request failed: ${error.message}`;
    }
  }

  async cleanup() {
    this.log('🧹 Cleaning up test data', 'info');

    if (this.createdProjectId) {
      try {
        await apiRequest('DELETE', `/api/projects/${this.createdProjectId}`);
        this.log(`🗑️ Deleted test project ${this.createdProjectId}`, 'success');
      } catch (error) {
        this.log(`⚠️ Failed to cleanup project ${this.createdProjectId}: ${error.message}`, 'warning');
      }
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Enhanced New Project Test Suite', 'info');
    this.log('=' .repeat(60), 'info');

    // Run all tests
    await this.runTest('Enhanced Project Creation', () => this.testEnhancedProjectCreation());
    await this.runTest('AI Content Enhancement', () => this.testAIContentEnhancement());
    await this.runTest('Integration Setup', () => this.testIntegrationSetup());
    await this.runTest('AI Calendar Generation', () => this.testAICalendarGeneration());
    await this.runTest('Project Dashboard', () => this.testProjectDashboard());
    await this.runTest('Regular Project Creation (Backward Compatibility)', () => this.testRegularProjectCreation());

    // Cleanup
    await this.cleanup();

    // Results summary
    this.log('\n' + '='.repeat(60), 'info');
    this.log('📊 TEST RESULTS SUMMARY', 'info');
    this.log('=' .repeat(60), 'info');
    this.log(`✅ Passed: ${this.testResults.passed}`, 'success');
    this.log(`❌ Failed: ${this.testResults.failed}`, 'error');
    this.log(`⏭️  Skipped: ${this.testResults.skipped}`, 'warning');
    this.log(`📈 Total: ${this.testResults.passed + this.testResults.failed + this.testResults.skipped}`, 'info');

    if (this.testResults.failed > 0) {
      this.log('\n❌ FAILED TESTS:', 'error');
      this.testResults.tests
        .filter(test => test.status === 'failed')
        .forEach(test => {
          this.log(`   • ${test.name}: ${test.error}`, 'error');
        });
    }

    const overallSuccess = this.testResults.failed === 0;
    this.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? 'SUCCESS' : 'FAILURE'}`, overallSuccess ? 'success' : 'error');

    return overallSuccess;
  }
}

// Main test runner
async function runTests() {
  const tester = new EnhancedProjectTester();

  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = EnhancedProjectTester;
