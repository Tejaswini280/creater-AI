// Simple test script to verify AI scheduling functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testProjectCreation() {
  console.log('🧪 Testing project creation...');
  
  const projectData = {
    name: 'Test AI Scheduling Project',
    description: 'A test project for AI scheduling',
    type: 'social-media',
    platform: 'instagram',
    channelTypes: ['instagram', 'tiktok'],
    contentType: ['post', 'reel'],
    duration: '1week',
    contentFrequency: 'daily',
    targetAudience: 'test audience',
    tags: ['test', 'ai'],
    isPublic: false,
    aiEnhancement: true
  };

  try {
    const response = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth, but we can see the validation
      },
      body: JSON.stringify(projectData)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 201 && data.project) {
      console.log('✅ Project creation successful!');
      return data.project.id;
    } else {
      console.log('❌ Project creation failed');
    }
  } catch (error) {
    console.error('❌ Error testing project creation:', error.message);
  }
}

async function testAISchedulingStatus(projectId) {
  if (!projectId) {
    console.log('⏭️ Skipping AI scheduling status test - no project ID');
    return;
  }

  console.log(`🧪 Testing AI scheduling status for project ${projectId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/ai-scheduling-status`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('AI Status response status:', response.status);
    const data = await response.json();
    console.log('AI Status response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ AI scheduling status endpoint working!');
    } else {
      console.log('❌ AI scheduling status failed');
    }
  } catch (error) {
    console.error('❌ Error testing AI scheduling status:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting AI Scheduling Tests...\n');
  
  const projectId = await testProjectCreation();
  console.log('\n');
  await testAISchedulingStatus(projectId);
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
