import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const testConfig = {
  headers: {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  }
};

async function waitForServer() {
  console.log('Waiting for server to be ready...');
  let retries = 0;
  while (retries < 30) {
    try {
      await axios.get(`${BASE_URL}/api/health`);
      console.log('Server is ready!');
      return;
    } catch (error) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Server not ready after 30 seconds');
}

async function debugWorkflows() {
  try {
    await waitForServer();
    
    console.log('🔍 DETAILED WORKFLOW DEBUG');
    console.log('==========================');
    
    // Test 1: Complete LinkedIn Workflow
    console.log('\n1. Testing Complete LinkedIn Workflow...');
    
    try {
      // Step 1: Connect LinkedIn
      console.log('   Step 1: Connecting LinkedIn...');
      const connectResponse = await axios.post(`${BASE_URL}/api/linkedin/connect`, {}, testConfig);
      console.log(`   Connect Status: ${connectResponse.status}`);
      console.log('   Connect Response:', JSON.stringify(connectResponse.data, null, 2));
      
      // Step 2: Create content
      console.log('\n   Step 2: Creating content...');
      const contentData = {
        title: 'Integration Test Content',
        description: 'Testing complete workflow',
        platform: 'linkedin',
        contentType: 'post'
      };
      const contentResponse = await axios.post(`${BASE_URL}/api/content/create`, contentData, testConfig);
      console.log(`   Content Status: ${contentResponse.status}`);
      console.log('   Content Response:', JSON.stringify(contentResponse.data, null, 2));
      
      // Step 3: Schedule content
      console.log('\n   Step 3: Scheduling content...');
      const scheduleData = {
        contentId: contentResponse.data.content.id,
        title: 'Scheduled Integration Test',
        platform: 'linkedin',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
      console.log(`   Schedule Status: ${scheduleResponse.status}`);
      console.log('   Schedule Response:', JSON.stringify(scheduleResponse.data, null, 2));
      
      // Check success condition
      const allSuccess = connectResponse.status === 200 && contentResponse.status === 200 && scheduleResponse.status === 200;
      console.log(`\n   Success Check: ${allSuccess}`);
      console.log(`   Connect: ${connectResponse.status === 200 ? 'PASS' : 'FAIL'}`);
      console.log(`   Content: ${contentResponse.status === 200 ? 'PASS' : 'FAIL'}`);
      console.log(`   Schedule: ${scheduleResponse.status === 200 ? 'PASS' : 'FAIL'}`);
      
      if (allSuccess) {
        console.log('   ✅ Complete LinkedIn Workflow: SUCCESS');
      } else {
        console.log('   ❌ Complete LinkedIn Workflow: FAILED');
      }
      
    } catch (error) {
      console.log('   ❌ Complete LinkedIn Workflow Error:', error.response?.status, error.response?.data);
    }
    
    // Test 2: Complete Scheduling Workflow
    console.log('\n2. Testing Complete Scheduling Workflow...');
    
    try {
      // Step 1: Upload file
      console.log('   Step 1: Uploading file...');
      const formData = new FormData();
      const testFilePath = path.join(__dirname, 'workflow-test.png');
      
      // Create a simple PNG file
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
        0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(testFilePath, pngHeader);
      formData.append('file', fs.createReadStream(testFilePath), {
        filename: 'workflow-test.png',
        contentType: 'image/png'
      });
      
      const uploadResponse = await axios.post(`${BASE_URL}/api/upload`, formData, {
        ...testConfig,
        headers: {
          ...testConfig.headers,
          ...formData.getHeaders()
        }
      });
      console.log(`   Upload Status: ${uploadResponse.status}`);
      console.log('   Upload Response:', JSON.stringify(uploadResponse.data, null, 2));
      
      // Step 2: Create content with file
      console.log('\n   Step 2: Creating content with file...');
      const contentData = {
        title: 'Workflow Test Content',
        description: 'Testing with uploaded file',
        platform: 'linkedin',
        contentType: 'post',
        mediaUrl: uploadResponse.data.file.url
      };
      const contentResponse = await axios.post(`${BASE_URL}/api/content/create`, contentData, testConfig);
      console.log(`   Content Status: ${contentResponse.status}`);
      console.log('   Content Response:', JSON.stringify(contentResponse.data, null, 2));
      
      // Step 3: Schedule content
      console.log('\n   Step 3: Scheduling content...');
      const scheduleData = {
        contentId: contentResponse.data.content.id,
        title: 'Workflow Scheduled Content',
        platform: 'linkedin',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };
      const scheduleResponse = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
      console.log(`   Schedule Status: ${scheduleResponse.status}`);
      console.log('   Schedule Response:', JSON.stringify(scheduleResponse.data, null, 2));
      
      // Check success condition
      const allSuccess = uploadResponse.status === 200 && contentResponse.status === 200 && scheduleResponse.status === 200;
      console.log(`\n   Success Check: ${allSuccess}`);
      console.log(`   Upload: ${uploadResponse.status === 200 ? 'PASS' : 'FAIL'}`);
      console.log(`   Content: ${contentResponse.status === 200 ? 'PASS' : 'FAIL'}`);
      console.log(`   Schedule: ${scheduleResponse.status === 200 ? 'PASS' : 'FAIL'}`);
      
      if (allSuccess) {
        console.log('   ✅ Complete Scheduling Workflow: SUCCESS');
      } else {
        console.log('   ❌ Complete Scheduling Workflow: FAILED');
      }
      
      // Clean up
      fs.unlinkSync(testFilePath);
      
    } catch (error) {
      console.log('   ❌ Complete Scheduling Workflow Error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('Debug execution failed:', error);
  }
}

debugWorkflows();
