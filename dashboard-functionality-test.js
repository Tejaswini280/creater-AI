import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const testConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token'
  }
};

async function testDashboardFunctionality() {
  console.log('🧪 Testing Dashboard Functionality...\n');

  const tests = [
    {
      name: '🔔 Notification System',
      tests: [
        {
          name: 'Get Notifications',
          fn: async () => {
            const response = await axios.get(`${BASE_URL}/api/notifications`, testConfig);
            return response.status === 200 && response.data.success;
          }
        },
        {
          name: 'Mark Notification as Read',
          fn: async () => {
            const response = await axios.put(`${BASE_URL}/api/notifications/1/read`, {}, testConfig);
            return response.status === 200 && response.data.success;
          }
        },
        {
          name: 'Mark All Notifications as Read',
          fn: async () => {
            const response = await axios.put(`${BASE_URL}/api/notifications/mark-all-read`, {}, testConfig);
            return response.status === 200 && response.data.success;
          }
        },
        {
          name: 'Delete Notification',
          fn: async () => {
            const response = await axios.delete(`${BASE_URL}/api/notifications/1`, testConfig);
            return response.status === 200 && response.data.success;
          }
        }
      ]
    },
    {
      name: '📄 Recent Content',
      tests: [
        {
          name: 'Get Recent Content',
          fn: async () => {
            const response = await axios.get(`${BASE_URL}/api/content?limit=5`, testConfig);
            return response.status === 200 && response.data.success;
          }
        },
        {
          name: 'Create Content',
          fn: async () => {
            const contentData = {
              title: 'Test Content',
              description: 'Test description',
              platform: 'youtube',
              contentType: 'video',
              status: 'draft'
            };
            const response = await axios.post(`${BASE_URL}/api/content`, contentData, testConfig);
            return response.status === 201 && response.data.success;
          }
        }
      ]
    },
    {
      name: '🎬 AI Video Generation',
      tests: [
        {
          name: 'Generate Video',
          fn: async () => {
            const videoData = {
              title: 'Test Video',
              script: 'This is a test video script',
              duration: '60',
              style: 'Educational',
              voiceType: 'Professional Female'
            };
            const response = await axios.post(`${BASE_URL}/api/ai/generate-video`, videoData, testConfig);
            return response.status === 200 && response.data.success;
          }
        }
      ]
    },
    {
      name: '🔊 AI Voiceover Generation',
      tests: [
        {
          name: 'Generate Voiceover',
          fn: async () => {
            const voiceoverData = {
              script: 'This is a test voiceover text',
              voice: 'nova',
              speed: 1.0,
              format: 'mp3',
              quality: 'high'
            };
            const response = await axios.post(`${BASE_URL}/api/ai/generate-voiceover`, voiceoverData, testConfig);
            return response.status === 200 && response.data.success;
          }
        }
      ]
    },
    {
      name: '🎯 Niche Finder',
      tests: [
        {
          name: 'Analyze Niche',
          fn: async () => {
            const nicheData = {
              category: 'tech review',
              region: 'US',
              competition: 'medium'
            };
            const response = await axios.post(`${BASE_URL}/api/analytics/analyze-niche`, nicheData, testConfig);
            return response.status === 200 && response.data.success;
          }
        }
      ]
    },
    {
      name: '📆 Content Scheduling',
      tests: [
        {
          name: 'Schedule Content',
          fn: async () => {
            const scheduleData = {
              title: 'Scheduled Test Content',
              description: 'This is scheduled content',
              content: 'This is the content to be scheduled',
              platform: 'youtube',
              scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              visibility: 'public'
            };
            const response = await axios.post(`${BASE_URL}/api/content/schedule`, scheduleData, testConfig);
            return response.status === 200 && response.data.success;
          }
        },
        {
          name: 'Get Scheduled Content',
          fn: async () => {
            const response = await axios.get(`${BASE_URL}/api/content/scheduled`, testConfig);
            return response.status === 200 && response.data.success;
          }
        }
      ]
    },
    {
      name: '🧰 Templates & Assets',
      tests: [
        {
          name: 'Get Templates',
          fn: async () => {
            const response = await axios.get(`${BASE_URL}/api/templates`, testConfig);
            return response.status === 200 && response.data.success;
          }
        },
        {
          name: 'Get Template Preview',
          fn: async () => {
            const response = await axios.get(`${BASE_URL}/api/templates/1/preview`, testConfig);
            return response.status === 200 && response.data.success;
          }
        },
        {
          name: 'Use Template',
          fn: async () => {
            const response = await axios.post(`${BASE_URL}/api/templates/1/use`, {}, testConfig);
            return response.status === 200 && response.data.success;
          }
        }
      ]
    },
    {
      name: '📊 Analytics & Metrics',
      tests: [
        {
          name: 'Get Dashboard Metrics',
          fn: async () => {
            const response = await axios.get(`${BASE_URL}/api/dashboard/metrics`, testConfig);
            return response.status === 200;
          }
        },
        {
          name: 'Get Content Analytics',
          fn: async () => {
            const response = await axios.get(`${BASE_URL}/api/content/analytics`, testConfig);
            return response.status === 200 && response.data.success;
          }
        }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const category of tests) {
    console.log(`\n${category.name}`);
    console.log('='.repeat(category.name.length));
    
    for (const test of category.tests) {
      totalTests++;
      try {
        const result = await test.fn();
        if (result) {
          console.log(`✅ ${test.name}`);
          passedTests++;
        } else {
          console.log(`❌ ${test.name} - Failed`);
          failedTests++;
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
        failedTests++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All dashboard functionality tests passed!');
    console.log('✅ Notification system working');
    console.log('✅ Content management working');
    console.log('✅ AI generation features working');
    console.log('✅ Scheduling system working');
    console.log('✅ Templates and assets working');
    console.log('✅ Analytics and metrics working');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the test
testDashboardFunctionality().catch(console.error); 