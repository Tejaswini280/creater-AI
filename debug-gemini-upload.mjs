import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';

async function testGeminiUpload() {
  console.log('🔍 Testing Gemini File Upload...');
  
  try {
    // Step 1: Test server connectivity
    console.log('\n1. Testing server connectivity...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Server is running:', healthResponse.status);
    } catch (error) {
      console.log('❌ Server not accessible:', error.message);
      return;
    }

    // Step 2: Test authentication
    console.log('\n2. Testing authentication...');
    const testConfig = {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    };

    try {
      const authResponse = await axios.get(`${BASE_URL}/api/auth/profile`, testConfig);
      console.log('✅ Authentication working:', authResponse.status);
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.status, error.response?.data);
      return;
    }

    // Step 3: Create a test image file
    console.log('\n3. Creating test image file...');
    const testImagePath = path.join(__dirname, 'test-gemini-image.png');
    
    // Create a minimal valid PNG file
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
    
    fs.writeFileSync(testImagePath, pngHeader);
    console.log('✅ Test image created:', testImagePath);

    // Step 4: Test file upload to Gemini analyze endpoint
    console.log('\n4. Testing Gemini file analysis...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-gemini-image.png',
      contentType: 'image/png'
    });
    formData.append('prompt', 'Analyze this test image for content creation opportunities');

    try {
      const uploadResponse = await axios.post(`${BASE_URL}/api/gemini/analyze-file`, formData, {
        headers: {
          'Authorization': 'Bearer test-token',
          ...formData.getHeaders()
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ File analysis successful!');
      console.log('Response status:', uploadResponse.status);
      console.log('Response data:', JSON.stringify(uploadResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ File analysis failed:');
      console.log('Status:', error.response?.status);
      console.log('Status text:', error.response?.statusText);
      console.log('Error message:', error.message);
      console.log('Response data:', error.response?.data);
      
      if (error.response?.data?.error) {
        console.log('Detailed error:', error.response.data.error);
      }
    }

    // Clean up
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n🧹 Test file cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testGeminiUpload();
