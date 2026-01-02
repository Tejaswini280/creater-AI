import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';

// Test configuration with correct test token
const testConfig = {
  headers: {
    'Authorization': 'Bearer test-token', // Use the correct test token
    'Content-Type': 'application/json'
  }
};

console.log('🚀 PHASE 3 FIXED COMPREHENSIVE TESTING');
console.log('======================================');
console.log('Testing: Social Media & Scheduling Integration');
console.log('Base URL:', BASE_URL);
console.log('');

// Test Results Tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}: PASSED`);
  } else {
    testResults.failed++;
    testResults.errors.push({ name, error });
    console.log(`❌ ${name}: FAILED`);
    if (error) {
      console.log(`   Error: ${error.message || error}`);
    }
  }
}

async function runAllTests() {
  console.log('📋 PHASE 3.1: LinkedIn OAuth Integration');
  console.log('----------------------------------------');
  
  // Test 3.1.1: LinkedIn OAuth Configuration
  try {
    const authResponse = await axios.get(`${BASE_URL}/api/linkedin/auth`, testConfig);
    if (authResponse.status === 200 && authResponse.data.authUrl) {
      logTest('LinkedIn OAuth Configuration', true);
    } else {
      logTest('LinkedIn OAuth Configuration', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn OAuth Configuration', false, error);
  }

  // Test 3.1.2: LinkedIn Connect Endpoint
  try {
    const connectResponse = await axios.post(`${BASE_URL}/api/linkedin/connect`, {}, testConfig);
    if (connectResponse.status === 200 && connectResponse.data.authUrl) {
      logTest('LinkedIn Connect Endpoint', true);
    } else {
      logTest('LinkedIn Connect Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn Connect Endpoint', false, error);
  }

  // Test 3.1.3: LinkedIn Profile Endpoint
  try {
    const profileResponse = await axios.get(`${BASE_URL}/api/linkedin/profile`, testConfig);
    if (profileResponse.status === 200 && profileResponse.data.profile) {
      logTest('LinkedIn Profile Endpoint', true);
    } else {
      logTest('LinkedIn Profile Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn Profile Endpoint', false, error);
  }

  // Test 3.1.4: LinkedIn Analytics Endpoint
  try {
    const analyticsResponse = await axios.get(`${BASE_URL}/api/linkedin/analytics`, testConfig);
    if (analyticsResponse.status === 200 && analyticsResponse.data.analytics) {
      logTest('LinkedIn Analytics Endpoint', true);
    } else {
      logTest('LinkedIn Analytics Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn Analytics Endpoint', false, error);
  }

  // Test 3.1.5: LinkedIn Publish Endpoint
  try {
    const publishData = {
      content: 'Test LinkedIn post from CreatorAI Studio',
      visibility: 'public',
      platform: 'linkedin'
    };
    const publishResponse = await axios.post(`${BASE_URL}/api/linkedin/publish`, publishData, testConfig);
    if (publishResponse.status === 200 && publishResponse.data.message) {
      logTest('LinkedIn Publish Endpoint', true);
    } else {
      logTest('LinkedIn Publish Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn Publish Endpoint', false, error);
  }

  // Test 3.1.6: LinkedIn Search People Endpoint
  try {
    const searchData = { query: 'software engineer' };
    const searchResponse = await axios.post(`${BASE_URL}/api/linkedin/search-people`, searchData, testConfig);
    if (searchResponse.status === 200 && Array.isArray(searchResponse.data.results)) {
      logTest('LinkedIn Search People Endpoint', true);
    } else {
      logTest('LinkedIn Search People Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn Search People Endpoint', false, error);
  }

  // Test 3.1.7: LinkedIn Send Message Endpoint
  try {
    const messageData = {
      recipientId: 'test-recipient',
      message: 'Test message from CreatorAI Studio'
    };
    const messageResponse = await axios.post(`${BASE_URL}/api/linkedin/send-message`, messageData, testConfig);
    if (messageResponse.status === 200 && messageResponse.data.message) {
      logTest('LinkedIn Send Message Endpoint', true);
    } else {
      logTest('LinkedIn Send Message Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn Send Message Endpoint', false, error);
  }

  // Test 3.1.8: LinkedIn Trending Content Endpoint
  try {
    const trendingResponse = await axios.get(`${BASE_URL}/api/linkedin/trending`, testConfig);
    if (trendingResponse.status === 200 && Array.isArray(trendingResponse.data.trending)) {
      logTest('LinkedIn Trending Content Endpoint', true);
    } else {
      logTest('LinkedIn Trending Content Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('LinkedIn Trending Content Endpoint', false, error);
  }

  console.log('');
  console.log('📋 PHASE 3.2: Content Scheduler Backend');
  console.log('----------------------------------------');

  // Test 3.2.1: Schedule Content Endpoint
  try {
    const scheduleData = {
      title: 'Test Scheduled Content',
      description: 'This is a test scheduled content',
      content: 'Test content for scheduling',
      platform: 'linkedin',
      contentType: 'post',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      autoPost: true,
      timezone: 'UTC'
    };
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
    if (scheduleResponse.status === 200 && scheduleResponse.data.scheduledContent) {
      logTest('Schedule Content Endpoint', true);
    } else {
      logTest('Schedule Content Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Schedule Content Endpoint', false, error);
  }

  // Test 3.2.2: Get Scheduled Content Endpoint
  try {
    const scheduledResponse = await axios.get(`${BASE_URL}/api/content/scheduled`, testConfig);
    if (scheduledResponse.status === 200 && Array.isArray(scheduledResponse.data.scheduledContent)) {
      logTest('Get Scheduled Content Endpoint', true);
    } else {
      logTest('Get Scheduled Content Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Get Scheduled Content Endpoint', false, error);
  }

  // Test 3.2.3: Update Scheduled Content Endpoint
  try {
    const updateData = {
      title: 'Updated Scheduled Content',
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };
    const updateResponse = await axios.put(`${BASE_URL}/api/content/schedule/test-id`, updateData, testConfig);
    if (updateResponse.status === 200 && updateResponse.data.scheduledContent) {
      logTest('Update Scheduled Content Endpoint', true);
    } else {
      logTest('Update Scheduled Content Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Update Scheduled Content Endpoint', false, error);
  }

  // Test 3.2.4: Delete Scheduled Content Endpoint
  try {
    const deleteResponse = await axios.delete(`${BASE_URL}/api/content/schedule/test-id`, testConfig);
    if (deleteResponse.status === 200 && deleteResponse.data.message) {
      logTest('Delete Scheduled Content Endpoint', true);
    } else {
      logTest('Delete Scheduled Content Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Delete Scheduled Content Endpoint', false, error);
  }

  // Test 3.2.5: Scheduling Validation
  try {
    const invalidScheduleData = {
      title: 'Invalid Schedule',
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Past date
    };
    try {
      await axios.post(`${BASE_URL}/api/content/schedule`, invalidScheduleData, testConfig);
      logTest('Scheduling Validation (Past Date)', false, 'Should reject past dates');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('Scheduling Validation (Past Date)', true);
      } else {
        logTest('Scheduling Validation (Past Date)', false, error);
      }
    }
  } catch (error) {
    logTest('Scheduling Validation (Past Date)', false, error);
  }

  console.log('');
  console.log('📋 PHASE 3.3: Authentication & User Management');
  console.log('-----------------------------------------------');

  // Test 3.3.1: User Registration Endpoint
  try {
    const registerData = {
      email: 'test-phase3-fixed@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    };
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    if (registerResponse.status === 201 && registerResponse.data.user) {
      logTest('User Registration Endpoint', true);
    } else {
      logTest('User Registration Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('User Registration Endpoint', false, error);
  }

  // Test 3.3.2: User Login Endpoint
  try {
    const loginData = {
      email: 'test-phase3-fixed@example.com',
      password: 'testpassword123'
    };
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    if (loginResponse.status === 200 && loginResponse.data.accessToken) {
      logTest('User Login Endpoint', true);
    } else {
      logTest('User Login Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('User Login Endpoint', false, error);
  }

  // Test 3.3.3: User Profile Endpoint
  try {
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, testConfig);
    if (profileResponse.status === 200 && profileResponse.data.user) {
      logTest('User Profile Endpoint', true);
    } else {
      logTest('User Profile Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('User Profile Endpoint', false, error);
  }

  // Test 3.3.4: Update User Profile Endpoint (This endpoint doesn't exist, so we'll skip it)
  logTest('Update User Profile Endpoint', false, 'Endpoint not implemented');

  // Test 3.3.5: Password Validation
  try {
    const invalidPasswordData = {
      email: 'test@example.com',
      password: '123' // Too short
    };
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, invalidPasswordData);
      logTest('Password Validation (Too Short)', false, 'Should reject short passwords');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('Password Validation (Too Short)', true);
      } else {
        logTest('Password Validation (Too Short)', false, error);
      }
    }
  } catch (error) {
    logTest('Password Validation (Too Short)', false, error);
  }

  console.log('');
  console.log('📋 PHASE 3.4: File Upload & Storage System');
  console.log('-------------------------------------------');

  // Test 3.4.1: File Upload Endpoint
  try {
    const formData = new FormData();
    const testFilePath = path.join(__dirname, 'test-file.txt');
    
    // Create a test file
    fs.writeFileSync(testFilePath, 'This is a test file for upload');
    
    formData.append('file', fs.createReadStream(testFilePath));
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/upload`, formData, {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        ...formData.getHeaders()
      }
    });
    
    if (uploadResponse.status === 200 && uploadResponse.data.file) {
      logTest('File Upload Endpoint', true);
    } else {
      logTest('File Upload Endpoint', false, 'Invalid response format');
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
  } catch (error) {
    logTest('File Upload Endpoint', false, error);
  }

  // Test 3.4.2: Get User Files Endpoint
  try {
    const filesResponse = await axios.get(`${BASE_URL}/api/files`, testConfig);
    if (filesResponse.status === 200 && Array.isArray(filesResponse.data.files)) {
      logTest('Get User Files Endpoint', true);
    } else {
      logTest('Get User Files Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Get User Files Endpoint', false, error);
  }

  // Test 3.4.3: Delete File Endpoint
  try {
    const deleteFileResponse = await axios.delete(`${BASE_URL}/api/files/test-file-id`, testConfig);
    if (deleteFileResponse.status === 200 && deleteFileResponse.data.message) {
      logTest('Delete File Endpoint', true);
    } else {
      logTest('Delete File Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('Delete File Endpoint', false, error);
  }

  // Test 3.4.4: File Download Endpoint
  try {
    const downloadResponse = await axios.get(`${BASE_URL}/api/files/test-file-id/download`, testConfig);
    if (downloadResponse.status === 200) {
      logTest('File Download Endpoint', true);
    } else {
      logTest('File Download Endpoint', false, 'Invalid response format');
    }
  } catch (error) {
    logTest('File Download Endpoint', false, error);
  }

  // Test 3.4.5: File Type Validation
  try {
    const formData = new FormData();
    const invalidFilePath = path.join(__dirname, 'test-invalid.exe');
    
    // Create an invalid file
    fs.writeFileSync(invalidFilePath, 'This is an invalid file type');
    
    formData.append('file', fs.createReadStream(invalidFilePath));
    
    try {
      await axios.post(`${BASE_URL}/api/upload`, formData, {
        ...testConfig,
        headers: {
          ...testConfig.headers,
          ...formData.getHeaders()
        }
      });
      logTest('File Type Validation', false, 'Should reject invalid file types');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('File Type Validation', true);
      } else {
        logTest('File Type Validation', false, error);
      }
    }
    
    // Clean up test file
    fs.unlinkSync(invalidFilePath);
  } catch (error) {
    logTest('File Type Validation', false, error);
  }

  console.log('');
  console.log('📋 PHASE 3: INTEGRATION TESTS');
  console.log('-----------------------------');

  // Test 3.5.1: Complete LinkedIn Workflow
  try {
    // 1. Connect LinkedIn
    const connectResponse = await axios.post(`${BASE_URL}/api/linkedin/connect`, {}, testConfig);
    
    // 2. Create content
    const contentData = {
      title: 'Integration Test Content',
      description: 'Testing complete workflow',
      platform: 'linkedin',
      contentType: 'post'
    };
    const contentResponse = await axios.post(`${BASE_URL}/api/content/create`, contentData, testConfig);
    
    // 3. Schedule content
    const scheduleData = {
      contentId: contentResponse.data.content.id,
      title: 'Scheduled Integration Test',
      platform: 'linkedin',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
    
    if (connectResponse.status === 200 && contentResponse.status === 200 && scheduleResponse.status === 200) {
      logTest('Complete LinkedIn Workflow', true);
    } else {
      logTest('Complete LinkedIn Workflow', false, 'Workflow failed');
    }
  } catch (error) {
    logTest('Complete LinkedIn Workflow', false, error);
  }

  // Test 3.5.2: Complete Scheduling Workflow
  try {
    // 1. Upload file
    const formData = new FormData();
    const testFilePath = path.join(__dirname, 'workflow-test.txt');
    fs.writeFileSync(testFilePath, 'Workflow test file');
    formData.append('file', fs.createReadStream(testFilePath));
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/upload`, formData, {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        ...formData.getHeaders()
      }
    });
    
    // 2. Create content with file
    const contentData = {
      title: 'Workflow Test Content',
      description: 'Testing with uploaded file',
      platform: 'linkedin',
      contentType: 'post',
      mediaUrl: uploadResponse.data.file.url
    };
    const contentResponse = await axios.post(`${BASE_URL}/api/content/create`, contentData, testConfig);
    
    // 3. Schedule content
    const scheduleData = {
      contentId: contentResponse.data.content.id,
      title: 'Workflow Scheduled Content',
      platform: 'linkedin',
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
    
    if (uploadResponse.status === 200 && contentResponse.status === 200 && scheduleResponse.status === 200) {
      logTest('Complete Scheduling Workflow', true);
    } else {
      logTest('Complete Scheduling Workflow', false, 'Workflow failed');
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
  } catch (error) {
    logTest('Complete Scheduling Workflow', false, error);
  }

  // Test 3.5.3: Error Handling
  try {
    // Test invalid LinkedIn credentials
    try {
      await axios.post(`${BASE_URL}/api/linkedin/publish`, {
        content: 'Test with invalid credentials'
      }, testConfig);
      logTest('Error Handling (Invalid Credentials)', false, 'Should handle invalid credentials');
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        logTest('Error Handling (Invalid Credentials)', true);
      } else {
        logTest('Error Handling (Invalid Credentials)', false, error);
      }
    }
  } catch (error) {
    logTest('Error Handling (Invalid Credentials)', false, error);
  }

  console.log('');
  console.log('📊 PHASE 3 TEST RESULTS SUMMARY');
  console.log('================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.failed > 0) {
    console.log('');
    console.log('❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   - ${error.name}: ${error.error}`);
    });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('');
    console.log('🎉 PHASE 3 COMPLETED SUCCESSFULLY!');
    console.log('All acceptance criteria and test cases passed with 100% success rate.');
  } else {
    console.log('');
    console.log('⚠️  PHASE 3 HAS FAILING TESTS');
    console.log('Please fix the failing tests before proceeding.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
