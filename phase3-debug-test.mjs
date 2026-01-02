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
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  }
};

console.log('🔍 PHASE 3 DEBUG TESTING');
console.log('========================');
console.log('Debugging specific failing tests...');
console.log('');

async function debugTests() {
  console.log('1. Testing Update User Profile Endpoint...');
  try {
    const updateProfileData = {
      firstName: 'Updated',
      lastName: 'Name'
    };
    const response = await axios.put(`${BASE_URL}/api/auth/profile`, updateProfileData, testConfig);
    console.log('✅ Update User Profile:', response.status, response.data);
  } catch (error) {
    console.log('❌ Update User Profile Error:', error.response?.status, error.response?.data);
  }

  console.log('\n2. Testing File Upload Endpoint...');
  try {
    const formData = new FormData();
    const testFilePath = path.join(__dirname, 'debug-test.txt');
    
    // Create a simple text file
    fs.writeFileSync(testFilePath, 'Debug test file content');
    
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'debug-test.txt',
      contentType: 'text/plain'
    });
    
    const response = await axios.post(`${BASE_URL}/api/upload`, formData, {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        ...formData.getHeaders()
      }
    });
    console.log('✅ File Upload:', response.status, response.data);
    
    // Clean up
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.log('❌ File Upload Error:', error.response?.status, error.response?.data);
  }

  console.log('\n3. Testing Get User Files Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/files`, testConfig);
    console.log('✅ Get User Files:', response.status, response.data);
  } catch (error) {
    console.log('❌ Get User Files Error:', error.response?.status, error.response?.data);
  }

  console.log('\n4. Testing Content Create Endpoint...');
  try {
    const contentData = {
      title: 'Debug Test Content',
      description: 'Testing content creation',
      platform: 'linkedin',
      contentType: 'post'
    };
    const response = await axios.post(`${BASE_URL}/api/content/create`, contentData, testConfig);
    console.log('✅ Content Create:', response.status, response.data);
  } catch (error) {
    console.log('❌ Content Create Error:', error.response?.status, error.response?.data);
  }

  console.log('\n5. Testing LinkedIn Publish with Invalid Credentials...');
  try {
    const response = await axios.post(`${BASE_URL}/api/linkedin/publish`, {
      content: 'Test with invalid credentials'
    }, testConfig);
    console.log('❌ LinkedIn Publish (should fail):', response.status, response.data);
  } catch (error) {
    console.log('✅ LinkedIn Publish Error (expected):', error.response?.status, error.response?.data);
  }
}

debugTests().catch(error => {
  console.error('Debug test failed:', error);
});
