#!/usr/bin/env node

/**
 * Check Database Projects
 * This script checks what projects exist in the database
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

console.log('🔍 Checking Database Projects\n');

async function checkDatabaseProjects() {
  try {
    // Step 1: Login to get authentication token
    console.log('1. Logging in...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.status);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get all projects from database
    console.log('\n2. Fetching projects from database...');
    
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (projectsResponse.status === 200) {
      const projects = projectsResponse.data.projects || [];
      console.log(`✅ Found ${projects.length} projects in database:`);
      
      if (projects.length === 0) {
        console.log('📭 No projects found in database');
      } else {
        projects.forEach((project, index) => {
          console.log(`\n📊 Project ${index + 1}:`);
          console.log(`   🆔 ID: ${project.id}`);
          console.log(`   📝 Name: ${project.name}`);
          console.log(`   🏷️ Type: ${project.type}`);
          console.log(`   📅 Created: ${project.createdAt}`);
          console.log(`   📍 Status: ${project.status}`);
          console.log(`   🎯 Platform: ${project.platform || 'Not specified'}`);
          console.log(`   🏷️ Tags: ${project.tags?.join(', ') || 'None'}`);
          
          if (project.metadata?.createdViaWizard) {
            console.log('   🧙 Created via Project Wizard');
          }
        });
      }
    } else {
      console.error('❌ Failed to fetch projects:', projectsResponse.status);
    }

    // Step 3: Check localStorage projects for comparison
    console.log('\n3. Checking localStorage projects...');
    
    // This would need to be run in browser context, so we'll skip it in Node.js
    console.log('ℹ️ localStorage check needs to be done in browser console:');
    console.log('   JSON.parse(localStorage.getItem("localProjects") || "[]")');

  } catch (error) {
    console.error('❌ Check failed with error:', error.message);
    
    if (error.response) {
      console.error('📄 Error response status:', error.response.status);
      console.error('📄 Error response data:', error.response.data);
    }
  }
}

// Run the check
checkDatabaseProjects().then(() => {
  console.log('\n🏁 Check completed');
}).catch(error => {
  console.error('\n💥 Check crashed:', error.message);
});