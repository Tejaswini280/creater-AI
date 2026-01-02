const fetch = require('node-fetch');

async function getTestToken() {
  console.log('🔑 Getting Test Authentication Token');
  console.log('=' .repeat(40));
  
  try {
    // Try to login with test credentials
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log('📡 Login Response Status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('📊 Login Response:', JSON.stringify(loginData, null, 2));
      
      const token = loginData.token || loginData.accessToken || loginData.access_token;
      console.log('🔑 Token:', token ? token.substring(0, 20) + '...' : 'Not found in response');
      
      if (!token) {
        console.log('❌ No token found in login response');
        return;
      }
      console.log('\n🎬 Testing video generation with valid token...');
      
      const videoResponse = await fetch('http://localhost:5000/api/ai/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: 'Generate a vibrant motivational video about achieving your dreams',
          style: 'modern',
          music: 'upbeat',
          duration: 30
        })
      });
      
      console.log('📡 Video API Response Status:', videoResponse.status);
      
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        console.log('✅ Video generation successful!');
        console.log('🎬 Video URL:', videoData.videoUrl);
        console.log('🖼️ Thumbnail URL:', videoData.thumbnailUrl);
        console.log('🤖 Model Used:', videoData.metadata?.model || 'Unknown');
        console.log('📊 Success:', videoData.success);
        
        if (videoData.demo) {
          console.log('⚠️ This is a demo video (fallback mode)');
        } else {
          console.log('🎉 Real AI video generated!');
        }
      } else {
        const errorData = await videoResponse.text();
        console.log('❌ Video generation failed:', errorData);
      }
      
    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Login failed:', errorData);
      console.log('\n💡 You may need to create a test user first.');
      console.log('   Try running: node create-test-user.cjs');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server is not running! Please start the server with: npm run dev');
    }
  }
}

getTestToken();