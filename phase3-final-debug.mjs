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

console.log('🔍 FINAL PHASE 3 DEBUG - LAST 2 TESTS');
console.log('=====================================');
console.log('');

async function debugFinalTests() {
  console.log('1. Testing Complete LinkedIn Workflow...');
  try {
    // 1. Connect LinkedIn
    console.log('   - Step 1: Connect LinkedIn');
    const connectResponse = await axios.post(`${BASE_URL}/api/linkedin/connect`, {}, testConfig);
    console.log('   ✅ Connect LinkedIn:', connectResponse.status);
    
    // 2. Create content
    console.log('   - Step 2: Create content');
    const contentData = {
      title: 'Integration Test Content',
      description: 'Testing complete workflow',
      platform: 'linkedin',
      contentType: 'post'
    };
    const contentResponse = await axios.post(`${BASE_URL}/api/content/create`, contentData, testConfig);
    console.log('   ✅ Create content:', contentResponse.status, contentResponse.data.content?.id);
    
    // 3. Schedule content
    console.log('   - Step 3: Schedule content');
    const scheduleData = {
      contentId: contentResponse.data.content.id,
      title: 'Scheduled Integration Test',
      platform: 'linkedin',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
    console.log('   ✅ Schedule content:', scheduleResponse.status);
    
    if (connectResponse.status === 200 && contentResponse.status === 200 && scheduleResponse.status === 200) {
      console.log('   ✅ Complete LinkedIn Workflow: SUCCESS');
    } else {
      console.log('   ❌ Complete LinkedIn Workflow: FAILED');
    }
  } catch (error) {
    console.log('   ❌ Complete LinkedIn Workflow Error:', error.response?.status, error.response?.data);
  }

  console.log('\n2. Testing Complete Scheduling Workflow...');
  try {
    // 1. Upload file
    console.log('   - Step 1: Upload file');
    const formData = new FormData();
    const testFilePath = path.join(__dirname, 'workflow-test.txt');
    fs.writeFileSync(testFilePath, 'Workflow test file content');
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'workflow-test.txt',
      contentType: 'text/plain'
    });
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/upload`, formData, {
      ...testConfig,
      headers: {
        ...testConfig.headers,
        ...formData.getHeaders()
      }
    });
    console.log('   ✅ Upload file:', uploadResponse.status, uploadResponse.data.file?.url);
    
    // 2. Create content with file
    console.log('   - Step 2: Create content with file');
    const contentData = {
      title: 'Workflow Test Content',
      description: 'Testing with uploaded file',
      platform: 'linkedin',
      contentType: 'post',
      mediaUrl: uploadResponse.data.file.url
    };
    const contentResponse = await axios.post(`${BASE_URL}/api/content/create`, contentData, testConfig);
    console.log('   ✅ Create content with file:', contentResponse.status, contentResponse.data.content?.id);
    
    // 3. Schedule content
    console.log('   - Step 3: Schedule content');
    const scheduleData = {
      contentId: contentResponse.data.content.id,
      title: 'Workflow Scheduled Content',
      platform: 'linkedin',
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    };
    const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
    console.log('   ✅ Schedule content:', scheduleResponse.status);
    
    if (uploadResponse.status === 200 && contentResponse.status === 200 && scheduleResponse.status === 200) {
      console.log('   ✅ Complete Scheduling Workflow: SUCCESS');
    } else {
      console.log('   ❌ Complete Scheduling Workflow: FAILED');
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.log('   ❌ Complete Scheduling Workflow Error:', error.response?.status, error.response?.data);
  }
}

debugFinalTests().catch(error => {
  console.error('Debug test failed:', error);
});
