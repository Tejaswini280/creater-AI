const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function seedSchedulerData() {
  console.log('🚀 Seeding Scheduler Data...\n');

  try {
    // Login first
    console.log('1. Logging in...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    let token = 'test-token';
    if (loginResponse.status === 200 && loginResponse.data.accessToken) {
      token = loginResponse.data.accessToken;
      console.log('✅ Login successful');
    } else {
      console.log('ℹ️ Using fallback token');
    }

    // Create scheduled content with proper future dates
    const now = new Date();
    const scheduledItems = [
      {
        title: 'Morning Motivation Video',
        description: 'Daily motivation content for morning audience',
        platform: 'youtube',
        contentType: 'video',
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        autoPost: true
      },
      {
        title: 'Instagram Story Update',
        description: 'Behind the scenes content for Instagram stories',
        platform: 'instagram',
        contentType: 'story',
        scheduledAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        autoPost: true
      },
      {
        title: 'LinkedIn Professional Post',
        description: 'Industry insights and professional tips',
        platform: 'linkedin',
        contentType: 'post',
        scheduledAt: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        autoPost: false
      },
      {
        title: 'TikTok Trending Video',
        description: 'Quick trending content for TikTok audience',
        platform: 'tiktok',
        contentType: 'video',
        scheduledAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
        autoPost: true
      },
      {
        title: 'Twitter Thread',
        description: 'Educational thread about social media marketing',
        platform: 'twitter',
        contentType: 'thread',
        scheduledAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
        autoPost: true
      }
    ];

    console.log('\n2. Creating scheduled content...');
    let successCount = 0;

    for (const item of scheduledItems) {
      try {
        const response = await makeRequest('POST', '/api/content/schedule', item, token);
        
        if (response.status === 200 || response.status === 201) {
          console.log(`✅ Created: ${item.title} (${item.platform}) - ${new Date(item.scheduledAt).toLocaleString()}`);
          successCount++;
        } else {
          console.log(`❌ Failed: ${item.title} - Status ${response.status}`);
          console.log('   Response:', response.data);
        }
      } catch (error) {
        console.log(`❌ Error creating ${item.title}:`, error.message);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Verify the created content
    console.log('\n3. Verifying scheduled content...');
    const verifyResponse = await makeRequest('GET', '/api/content/scheduled', null, token);
    
    if (verifyResponse.status === 200) {
      const scheduledContent = verifyResponse.data.scheduledContent || [];
      console.log(`✅ Found ${scheduledContent.length} scheduled items in database`);
      
      scheduledContent.forEach((item, index) => {
        const scheduledTime = new Date(item.scheduledAt).toLocaleString();
        console.log(`   ${index + 1}. ${item.title} - ${item.platform} - ${scheduledTime}`);
      });
    }

    console.log('\n🎉 Scheduler data seeding completed!');
    console.log(`📊 Successfully created ${successCount} out of ${scheduledItems.length} scheduled items`);
    console.log('🌐 Visit http://localhost:5000/scheduler to view your scheduled content');

  } catch (error) {
    console.error('❌ Error seeding scheduler data:', error);
  }
}

seedSchedulerData();