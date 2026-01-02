const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugStructuredOutput() {
  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.accessToken;

    // Test simple schema first
    console.log('🔍 Testing simple schema...');
    const response = await axios.post(`${BASE_URL}/api/gemini/generate-structured`, {
      prompt: "Create a blog post about AI",
      schema: {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "content": { "type": "string" },
          "tags": { "type": "array", "items": { "type": "string" } },
          "word_count": { "type": "integer" }
        },
        "required": ["title", "content"]
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Full response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugStructuredOutput();