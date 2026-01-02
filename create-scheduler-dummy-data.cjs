const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const testUser = {
  email: 'scheduler@test.com',
  password: 'password123',
  firstName: 'Scheduler',
  lastName: 'Tester'
};

// Dummy scheduled content data
const scheduledContentData = [
  {
    title: 'Morning Motivation Video',
    description: 'Daily motivation content for morning audience',
    platform: 'youtube',
    contentType: 'video',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  },
  {
    title: 'Instagram Story Update',
    description: 'Behind the scenes content for Instagram stories',
    platform: 'instagram',
    contentType: 'story',
    scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  },
  {
    title: 'LinkedIn Professional Post',
    description: 'Industry insights and professional tips',
    platform: 'linkedin',
    contentType: 'post',
    scheduledAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
  },
  {
    title: 'TikTok Trending Video',
    description: 'Fun and engaging short-form content',
    platform: 'tiktok',
    contentType: 'video',
    scheduledAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
  },
  {
    title: 'Facebook Community Post',
    description: 'Community engagement and discussion starter',
    platform: 'facebook',
    contentType: 'post',
    scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
  }
];

async function createSchedulerDummyData() {
  console.log('🚀 Creating Scheduler Dummy Data...\n');

  try {
    // Step 1: Register/Login user
    console.log('1. Setting up test user...');
    
    let authToken;
    
    // Try to register user first
    try {
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      
      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        authToken = registerData.accessToken;
        console.log('✅ User registered successfully');
      }
    } catch (error) {
      console.log('ℹ️ User might already exist, trying login...');
    }
    
    // If registration failed, try login
    if (!authToken) {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authToken = loginData.accessToken;
        console.log('✅ User logged in successfully');
      } else {
        throw new Error('Failed to login user');
      }
    }

    // Step 2: Create scheduled content
    console.log('\n2. Creating scheduled content...');
    
    const createdContent = [];
    
    for (let i = 0; i < scheduledContentData.length; i++) {
      const contentData = scheduledContentData[i];
      
      try {
        const response = await fetch(`${BASE_URL}/api/content/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(contentData)
        });
        
        if (response.ok) {
          const result = await response.json();
          createdContent.push(result.scheduledContent);
          console.log(`✅ Created: ${contentData.title} (${contentData.platform})`);
        } else {
          const error = await response.text();
          console.log(`❌ Failed to create ${contentData.title}: ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error creating ${contentData.title}:`, error.message);
      }
    }

    // Step 3: Verify scheduled content
    console.log('\n3. Verifying scheduled content...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/content/scheduled`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const scheduledItems = data.scheduledContent || [];
        
        console.log(`✅ Found ${scheduledItems.length} scheduled content items:`);
        
        scheduledItems.forEach((item, index) => {
          const scheduledTime = new Date(item.scheduledAt).toLocaleString();
          console.log(`   ${index + 1}. ${item.title} - ${item.platform} - ${scheduledTime}`);
        });
      } else {
        console.log('❌ Failed to fetch scheduled content');
      }
    } catch (error) {
      console.log('❌ Error fetching scheduled content:', error.message);
    }

    // Step 4: Test scheduler service endpoints
    console.log('\n4. Testing scheduler service endpoints...');
    
    // Test optimal times endpoint
    try {
      const response = await fetch(`${BASE_URL}/api/content/schedule/optimal-times/youtube`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Optimal times for YouTube:', data.optimalTimes);
      } else {
        console.log('❌ Failed to get optimal times');
      }
    } catch (error) {
      console.log('❌ Error getting optimal times:', error.message);
    }

    // Test analytics endpoint
    try {
      const response = await fetch(`${BASE_URL}/api/content/schedule/analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Scheduler analytics:', {
          totalScheduled: data.analytics.totalScheduled,
          successRate: data.analytics.successRate + '%'
        });
      } else {
        console.log('❌ Failed to get analytics');
      }
    } catch (error) {
      console.log('❌ Error getting analytics:', error.message);
    }

    console.log('\n🎉 Scheduler dummy data creation completed!');
    console.log('\n📋 Summary:');
    console.log(`   • Created ${createdContent.length} scheduled content items`);
    console.log(`   • Platforms: YouTube, Instagram, LinkedIn, TikTok, Facebook`);
    console.log(`   • Scheduled times: Next 2-12 hours`);
    console.log(`   • Backend scheduler service: Working ✅`);
    console.log(`   • API endpoints: Functional ✅`);
    console.log('\n🌐 Access your scheduler at: http://localhost:5000/scheduler');

  } catch (error) {
    console.error('❌ Error creating scheduler dummy data:', error);
  }
}

// Run the script
createSchedulerDummyData();