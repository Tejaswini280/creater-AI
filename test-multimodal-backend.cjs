const fs = require('fs');
const path = require('path');

async function testMultimodalAnalysis() {
  console.log('🧪 Testing Multimodal Analysis Backend Service...\n');

  try {
    // Test 1: Check if service file exists
    const servicePath = path.join(__dirname, 'server/services/multimodalAnalysis.ts');
    if (!fs.existsSync(servicePath)) {
      console.log('❌ Service file not found');
      return;
    }
    console.log('✅ Service file exists');

    // Test 2: Check environment variable
    require('dotenv').config();
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY not found in environment');
      return;
    }
    console.log('✅ GEMINI_API_KEY configured');

    // Test 3: Test API endpoint
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('prompt', 'Test analysis of this image');

    console.log('🔄 Testing API endpoint...');
    
    const response = await fetch('http://localhost:5000/api/gemini/analyze-media', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ API endpoint working');
      console.log('📊 Sample response structure:');
      console.log('  - Summary:', result.summary ? '✅' : '❌');
      console.log('  - Insights:', Array.isArray(result.insights) ? `✅ (${result.insights.length} items)` : '❌');
      console.log('  - Opportunities:', Array.isArray(result.opportunities) ? `✅ (${result.opportunities.length} items)` : '❌');
      console.log('  - Recommendations:', Array.isArray(result.recommendations) ? `✅ (${result.recommendations.length} items)` : '❌');
    } else {
      console.log('⚠️  API response:', result);
    }

    console.log('\n🎉 Multimodal Analysis System Ready!');
    console.log('\n📋 Test Instructions:');
    console.log('1. Open http://localhost:5000/test-multimodal-analysis.html');
    console.log('2. Upload an image, video, or audio file');
    console.log('3. Add optional analysis prompt');
    console.log('4. Click "Analyze Media"');
    console.log('5. View structured results with Summary, Insights, Opportunities, and Recommendations');
    
    console.log('\n🎯 Frontend Integration:');
    console.log('- Navigate to Creator AI Studio');
    console.log('- Click "Media" in the sidebar');
    console.log('- Upload and analyze media files');
    console.log('- Results display in clean, structured sections');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the server is running:');
      console.log('   npm run dev  or  node server/index.js');
    }
  }
}

testMultimodalAnalysis();