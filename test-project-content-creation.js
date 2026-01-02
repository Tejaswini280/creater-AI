const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = '';
let testProjectId = null;
let testContentId = null;

async function testProjectContentCreation() {
  console.log('🚀 Testing Project Content Creation Functionality...\n');

  try {
    // Step 1: Login to get authentication token
    console.log('1. Authenticating user...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, TEST_USER);
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      authToken = loginResponse.data.token;
      console.log('✅ User authenticated successfully');
    } else {
      throw new Error('Authentication failed');
    }

    const testConfig = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    // Step 2: Create a test project
    console.log('\n2. Creating test project...');
    const projectData = {
      name: 'Test Project for Content Creation',
      description: 'A test project to verify content creation functionality',
      type: 'video',
      status: 'active',
      platform: 'youtube',
      targetAudience: 'Content creators',
      estimatedDuration: '5-10 minutes'
    };

    const projectResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, testConfig);
    
    if (projectResponse.status === 201 && projectResponse.data.success) {
      testProjectId = projectResponse.data.project.id;
      console.log('✅ Test project created successfully');
      console.log(`   Project ID: ${testProjectId}`);
      console.log(`   Project Name: ${projectResponse.data.project.name}`);
    } else {
      throw new Error('Failed to create test project');
    }

    // Step 3: Test content creation with projectId
    console.log('\n3. Testing content creation with projectId...');
    const contentData = {
      title: 'Test Content for Project',
      description: 'This content should be linked to the test project',
      platform: 'youtube',
      contentType: 'video',
      status: 'draft',
      tags: ['test', 'project', 'content'],
      projectId: testProjectId
    };

    const contentResponse = await axios.post(`${BASE_URL}/api/content`, contentData, testConfig);
    
    if (contentResponse.status === 201 && contentResponse.data.success) {
      testContentId = contentResponse.data.content.id;
      console.log('✅ Content created successfully with projectId');
      console.log(`   Content ID: ${testContentId}`);
      console.log(`   Project ID: ${contentResponse.data.content.projectId}`);
      console.log(`   Title: ${contentResponse.data.content.title}`);
    } else {
      throw new Error('Failed to create content with projectId');
    }

    // Step 4: Verify content is linked to project
    console.log('\n4. Verifying content is linked to project...');
    const projectContentResponse = await axios.get(`${BASE_URL}/api/projects/${testProjectId}/content`, testConfig);
    
    if (projectContentResponse.status === 200 && projectContentResponse.data.success) {
      const projectContent = projectContentResponse.data.content;
      console.log(`✅ Project content retrieved successfully`);
      console.log(`   Found ${projectContent.length} content items in project`);
      
      const linkedContent = projectContent.find(item => item.id === testContentId);
      if (linkedContent) {
        console.log('✅ Created content is properly linked to project');
        console.log(`   Content ID: ${linkedContent.id}`);
        console.log(`   Project ID: ${linkedContent.projectId}`);
        console.log(`   Title: ${linkedContent.title}`);
      } else {
        throw new Error('Created content not found in project content list');
      }
    } else {
      throw new Error('Failed to retrieve project content');
    }

    // Step 5: Test project details endpoint
    console.log('\n5. Testing project details endpoint...');
    const projectDetailsResponse = await axios.get(`${BASE_URL}/api/projects/${testProjectId}`, testConfig);
    
    if (projectDetailsResponse.status === 200 && projectDetailsResponse.data.success) {
      const project = projectDetailsResponse.data.project;
      console.log('✅ Project details retrieved successfully');
      console.log(`   Project Name: ${project.name}`);
      console.log(`   Project Type: ${project.type}`);
      console.log(`   Project Description: ${project.description}`);
    } else {
      throw new Error('Failed to retrieve project details');
    }

    console.log('\n🎉 All tests passed! Project content creation is working correctly.');
    console.log('\n📋 Test Summary:');
    console.log(`   ✅ Project created: ${testProjectId}`);
    console.log(`   ✅ Content created: ${testContentId}`);
    console.log(`   ✅ Content linked to project: ${testContentId} -> ${testProjectId}`);
    console.log(`   ✅ Project content filtering: Working`);
    console.log(`   ✅ Project details: Working`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testProjectContentCreation();
