import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const authToken = 'test-token';

async function debugMediaAI() {
  console.log('🔍 Debugging Media AI Service...');
  
  // Test thumbnail generation
  console.log('\n1. Testing Thumbnail Generation...');
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-thumbnail`, {
      prompt: 'Professional thumbnail for a tech tutorial video',
      style: 'modern',
      aspectRatio: '16:9',
      size: '1792x1024'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Thumbnail Generation Success!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Thumbnail Generation Error:');
    console.log('Status:', error.response?.status);
    console.log('Status text:', error.response?.statusText);
    console.log('Response data:', error.response?.data);
    console.log('Error message:', error.message);
  }
  
  // Test voiceover generation
  console.log('\n2. Testing Voiceover Generation...');
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, {
      text: 'Welcome to our tutorial on AI-powered content creation.',
      voice: 'alloy',
      speed: 1.0,
      format: 'mp3'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Voiceover Generation Success!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Voiceover Generation Error:');
    console.log('Status:', error.response?.status);
    console.log('Status text:', error.response?.statusText);
    console.log('Response data:', error.response?.data);
    console.log('Error message:', error.message);
  }
}

debugMediaAI(); 