import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const authToken = 'test-token';

async function debugGemini() {
  console.log('🔍 Debugging Gemini Service...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-text`, {
      prompt: 'Write a short story about AI and creativity'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Success!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status text:', error.response?.statusText);
    console.log('Response data:', error.response?.data);
    console.log('Error message:', error.message);
  }
}

debugGemini(); 