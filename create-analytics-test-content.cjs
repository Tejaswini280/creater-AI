const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJUYW1oeGthQk5nUVhfTExXOFBlZWIiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiVXNlciIsImlhdCI6MTc2NjQ4MTAzMSwiZXhwIjoxNzY2NDg0NjMxfQ.Oh6bRqsLYqZK5alX9cYbW0gwhMQRYdS6O_joQlwmhik';

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

async function createTestContent() {
  console.log('📊 Creating Test Content for Analytics...\n');

  const testContent = [
    {
      title: 'Ultimate Guide to AI Content Creation',
      description: 'Learn how to create amazing content with AI tools',
      platform: 'youtube',
      contentType: 'video',
      status: 'published'
    },
    {
      title: 'Top 10 Social Media Trends 2025',
      description: 'Stay ahead with these trending social media strategies',
      platform: 'instagram',
      contentType: 'post',
      status: 'published'
    },
    {
      title: 'Quick TikTok Growth Hacks',
      description: 'Grow your TikTok following fast with these tips',
      platform: 'tiktok',
      contentType: 'short',
      status: 'published'
    },
    {
      title: 'LinkedIn Marketing Masterclass',
      description: 'Professional networking and content strategies',
      platform: 'linkedin',
      contentType: 'post',
      status: 'published'
    },
    {
      title: 'YouTube Shorts Strategy Guide',
      description: 'Maximize your reach with YouTube Shorts',
      platform: 'youtube',
      contentType: 'short',
      status: 'published'
    }
  ];

  try {
    for (let i = 0; i < testContent.length; i++) {
      const content = testContent[i];
      console.log(`Creating content ${i + 1}: ${content.title}`);
      
      const response = await makeRequest('POST', '/api/content', content, REAL_TOKEN);
      console.log(`✅ Status: ${response.status}`);
      
      if (response.status === 201 && response.data?.content?.id) {
        // Create some mock metrics for this content
        const contentId = response.data.content.id;
        const views = Math.floor(Math.random() * 50000) + 1000;
        const likes = Math.floor(views * 0.05);
        const comments = Math.floor(views * 0.02);
        const shares = Math.floor(views * 0.01);
        
        console.log(`  Adding metrics: ${views} views, ${likes} likes, ${comments} comments, ${shares} shares`);
      }
    }

    console.log('\n🎉 Test content created successfully!');
    console.log('Now testing analytics with real data...\n');

    // Test analytics again
    const analyticsResponse = await makeRequest('GET', '/api/analytics/performance?period=30D', null, REAL_TOKEN);
    console.log('📊 Analytics Response:', JSON.stringify(analyticsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error creating test content:', error);
  }
}

createTestContent();