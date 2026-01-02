const axios = require('axios');

async function checkCode() {
  try {
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com', 
      password: 'password123'
    });
    
    const token = login.data.accessToken;
    const response = await axios.post('http://localhost:5000/api/gemini/generate-code', {
      description: 'Simple hello world function',
      language: 'javascript'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const code = response.data.data.code;
    console.log('Generated code preview:');
    console.log(code.substring(0, 300));
    console.log('\n---');
    console.log('Contains "TODO":', code.includes('TODO'));
    console.log('Contains "generatedFunction":', code.includes('generatedFunction'));
    console.log('Contains "GeneratedClass":', code.includes('GeneratedClass'));
    console.log('Contains "Add your implementation":', code.includes('Add your implementation'));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCode();