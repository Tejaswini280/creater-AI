#!/usr/bin/env node

/**
 * Test Project Database Storage
 * This script tests if projects created via Project Wizard are properly stored in the database
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

console.log('🧪 Testing Project Database Storage\n');

async function testProjectCreation() {
  try {
    // Step 1: Login to get authentication token
    console.log('1. Logging in to get authentication token...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    // Step 2: Create project with Project Wizard data structure
    console.log('\n2. Creating project with Project Wizard data...');
    
    const projectData = {
      name: 'Test Database Project',
      description: 'Testing if project data is properly stored in database',
      type: 'social-media',
      platform: 'instagram',
      targetAudience: 'Young professionals',
      estimatedDuration: '3-months',
      tags: ['instagram', 'marketing', 'social-media'],
      isPublic: false,
      status: 'active',
      metadata: {
        originalData: {
          name: 'Test Database Project',
          description: 'Testing if project data is properly stored in database',
          contentType: 'video',
          category: 'beginner',
          targetAudience: 'Young professionals',
          goals: ['Increase Brand Awareness', 'Drive Website Traffic'],
          contentFormats: ['video', 'image'],
          postingFrequency: 'daily',
          contentThemes: ['Educational Content', 'Behind the Scenes'],
          brandVoice: 'professional',
          contentLength: 'medium',
          platforms: ['instagram', 'facebook'],
          aiTools: ['Content Generation', 'Hashtag Research'],
          schedulingPreferences: {
            autoSchedule: true,
            timeZone: 'UTC',
            preferredTimes: ['09:00', '15:00']
          },
          startDate: '2024-01-01',
          duration: '3-months',
          budget: '1000-5000',
          teamMembers: ['test@example.com']
        },
        createdViaWizard: true,
        wizardVersion: '1.0'
      }
    };

    const createResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.status === 201) {
      console.log('✅ Project created successfully!');
      console.log('📊 Response:', createResponse.data);
      
      const createdProject = createResponse.data.project;
      console.log('🆔 Project ID:', createdProject.id);
      console.log('📝 Project Name:', createdProject.name);
      console.log('🏷️ Project Type:', createdProject.type);
      
      // Step 3: Verify project exists in database
      console.log('\n3. Verifying project exists in database...');
      
      const getResponse = await axios.get(`${BASE_URL}/api/projects/${createdProject.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (getResponse.status === 200) {
        console.log('✅ Project retrieved from database successfully!');
        console.log('📊 Retrieved project:', getResponse.data);
      } else {
        console.log('❌ Failed to retrieve project from database');
      }

      // Step 4: List all projects to verify it appears
      console.log('\n4. Listing all projects...');
      
      const listResponse = await axios.get(`${BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (listResponse.status === 200) {
        console.log('✅ Projects list retrieved successfully!');
        console.log('📊 Total projects:', listResponse.data.projects?.length || 0);
        
        const foundProject = listResponse.data.projects?.find(p => p.id === createdProject.id);
        if (foundProject) {
          console.log('✅ Created project found in projects list!');
        } else {
          console.log('❌ Created project NOT found in projects list');
        }
      }

      // Step 5: Clean up - delete test project
      console.log('\n5. Cleaning up test project...');
      
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/api/projects/${createdProject.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (deleteResponse.status === 200) {
          console.log('✅ Test project deleted successfully');
        }
      } catch (deleteError) {
        console.log('⚠️ Could not delete test project (this is okay for testing)');
      }

    } else {
      console.error('❌ Project creation failed:', createResponse.status);
      console.error('📄 Response:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.response) {
      console.error('📄 Error response status:', error.response.status);
      console.error('📄 Error response data:', error.response.data);
    }
  }
}

// Run the test
testProjectCreation().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('\n💥 Test crashed:', error.message);
});