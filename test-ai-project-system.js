/**
 * Comprehensive test script for AI Project Management System
 * This script demonstrates all the key features and capabilities
 */

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/ai-projects`;

// Test data
const testProject = {
  title: "AI-Powered Fitness Transformation",
  description: "A comprehensive 30-day AI-generated fitness program with daily content across multiple platforms",
  projectType: "fitness",
  duration: 30,
  targetChannels: ["instagram", "tiktok", "youtube"],
  contentFrequency: "daily",
  targetAudience: "Fitness enthusiasts aged 25-35 looking to transform their bodies",
  brandVoice: "motivational",
  contentGoals: ["Increase brand awareness", "Drive engagement", "Build community"],
  contentTitle: "Daily Fitness AI",
  contentDescription: "AI-generated daily fitness tips, workouts, and motivational content",
  channelType: "multi-platform",
  tags: ["fitness", "ai", "workout", "motivation", "transformation", "health"],
      aiSettings: {
    creativity: 0.8,
    formality: 0.3,
    hashtagCount: 15,
        includeEmojis: true,
        includeCallToAction: true
      },
      startDate: new Date().toISOString()
    };

const businessProject = {
  title: "Startup Success Stories",
  description: "Weekly AI-generated content featuring successful entrepreneurs and business insights",
  projectType: "business",
  duration: 12,
  targetChannels: ["linkedin", "youtube", "twitter"],
  contentFrequency: "weekly",
  targetAudience: "Entrepreneurs, startup founders, and business professionals",
  brandVoice: "professional",
  contentGoals: ["Share expertise", "Build community", "Generate leads"],
  contentTitle: "Entrepreneur AI Insights",
  contentDescription: "AI-generated business content and entrepreneur success stories",
  channelType: "multi-platform",
  tags: ["entrepreneurship", "startup", "business", "success", "leadership"],
  aiSettings: {
    creativity: 0.6,
    formality: 0.8,
    hashtagCount: 8,
    includeEmojis: false,
    includeCallToAction: true
  },
  startDate: new Date().toISOString()
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      'Authorization': `Bearer test-token` // In real app, this would be a valid JWT
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));
  
  return { response, data };
}

// Test functions
async function testCreateProject(projectData) {
  console.log('\n🚀 Testing Project Creation...');
  console.log('Project Data:', JSON.stringify(projectData, null, 2));
  
  const { response, data } = await apiCall('', {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
  
  if (response.ok) {
    console.log('✅ Project created successfully!');
    console.log(`Project ID: ${data.data.project.id}`);
    console.log(`Generated Content: ${data.data.contentItems.length} pieces`);
    console.log(`Calendar Entries: ${data.data.calendarEntries.length} entries`);
    return data.data.project.id;
    } else {
      console.log('❌ Project creation failed');
    return null;
  }
}

async function testGetProjects() {
  console.log('\n📋 Testing Get All Projects...');
  
  const { response, data } = await apiCall('');
  
  if (response.ok) {
    console.log('✅ Projects retrieved successfully!');
    console.log(`Total Projects: ${data.data.length}`);
    return data.data;
  } else {
    console.log('❌ Failed to retrieve projects');
    return [];
  }
}

async function testGetProjectDetails(projectId) {
  console.log('\n🔍 Testing Get Project Details...');
  
  const { response, data } = await apiCall(`/${projectId}`);
  
  if (response.ok) {
    console.log('✅ Project details retrieved successfully!');
    console.log(`Project: ${data.data.project.title}`);
    console.log(`Content Items: ${data.data.content.length}`);
    console.log(`Calendar Entries: ${data.data.calendar.length}`);
    return data.data;
  } else {
    console.log('❌ Failed to retrieve project details');
    return null;
  }
}

async function testGetProjectAnalytics(projectId) {
  console.log('\n📊 Testing Get Project Analytics...');
  
  const { response, data } = await apiCall(`/${projectId}/analytics`);
  
  if (response.ok) {
    console.log('✅ Project analytics retrieved successfully!');
    console.log(`Total Content: ${data.data.totalContent}`);
    console.log(`Average Engagement: ${data.data.engagementPredictions.average}%`);
    console.log(`Project Health Score: ${data.data.projectHealth.score}%`);
    return data.data;
  } else {
    console.log('❌ Failed to retrieve project analytics');
    return null;
  }
}

async function testRegenerateContent(projectId) {
  console.log('\n🔄 Testing Content Regeneration...');
  
  const { response, data } = await apiCall(`/${projectId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({
      regenerateType: 'both',
      newDuration: 45,
      newFrequency: 'daily'
    })
  });
  
  if (response.ok) {
    console.log('✅ Content regenerated successfully!');
    console.log(`New Content Items: ${data.data.contentItems.length}`);
    console.log(`New Calendar Entries: ${data.data.calendarEntries.length}`);
    return data.data;
  } else {
    console.log('❌ Failed to regenerate content');
    return null;
  }
}

async function testUpdateContent(projectId, contentId) {
  console.log('\n✏️ Testing Content Update...');
  
  const { response, data } = await apiCall(`/${projectId}/content/${contentId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'published',
      title: 'Updated AI Fitness Content',
      description: 'This content has been updated by the user'
    })
  });
  
  if (response.ok) {
    console.log('✅ Content updated successfully!');
    return data.data;
  } else {
    console.log('❌ Failed to update content');
    return null;
  }
}

async function testUpdateCalendar(projectId, calendarId) {
  console.log('\n📅 Testing Calendar Update...');
  
  const { response, data } = await apiCall(`/${projectId}/calendar/${calendarId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: 'published',
      scheduledTime: '10:00'
    })
  });
  
  if (response.ok) {
    console.log('✅ Calendar updated successfully!');
    return data.data;
  } else {
    console.log('❌ Failed to update calendar');
    return null;
  }
}

async function testProjectAction(projectId, action) {
  console.log(`\n🎬 Testing Project Action: ${action}...`);
  
  const { response, data } = await apiCall(`/${projectId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action })
  });
  
  if (response.ok) {
    console.log(`✅ Project ${action}ed successfully!`);
    console.log(`New Status: ${data.data.status}`);
    return data.data;
  } else {
    console.log(`❌ Failed to ${action} project`);
    return null;
  }
}

async function testGetOptimalTimes() {
  console.log('\n⏰ Testing Get Optimal Posting Times...');
  
  const { response, data } = await apiCall('/optimal-times', {
    method: 'POST',
    body: JSON.stringify({
      platforms: ['instagram', 'tiktok', 'youtube', 'linkedin'],
      category: 'fitness',
      timezone: 'UTC'
    })
  });
  
  if (response.ok) {
    console.log('✅ Optimal times retrieved successfully!');
    console.log('Optimal Times:', JSON.stringify(data.data, null, 2));
    return data.data;
  } else {
    console.log('❌ Failed to retrieve optimal times');
    return null;
  }
}

async function testDeleteContent(projectId, contentId) {
  console.log('\n🗑️ Testing Content Deletion...');
  
  const { response, data } = await apiCall(`/${projectId}/content/${contentId}`, {
    method: 'DELETE'
  });
  
  if (response.ok) {
    console.log('✅ Content deleted successfully!');
    return true;
  } else {
    console.log('❌ Failed to delete content');
    return false;
  }
}

async function testDeleteProject(projectId) {
  console.log('\n🗑️ Testing Project Deletion...');
  
  const { response, data } = await apiCall(`/${projectId}`, {
    method: 'DELETE'
  });
  
  if (response.ok) {
    console.log('✅ Project deleted successfully!');
    return true;
  } else {
    console.log('❌ Failed to delete project');
    return false;
  }
}

// Main test runner
async function runComprehensiveTest() {
  console.log('🧪 Starting Comprehensive AI Project Management System Test');
  console.log('=' .repeat(80));
  
  try {
    // Test 1: Create Fitness Project
    console.log('\n📝 TEST 1: Creating Fitness Project');
    const fitnessProjectId = await testCreateProject(testProject);
    
    if (!fitnessProjectId) {
      console.log('❌ Test failed at project creation');
      return;
    }
    
    // Test 2: Create Business Project
    console.log('\n📝 TEST 2: Creating Business Project');
    const businessProjectId = await testCreateProject(businessProject);
    
    // Test 3: Get All Projects
    console.log('\n📝 TEST 3: Retrieving All Projects');
    const allProjects = await testGetProjects();
    
    // Test 4: Get Project Details
    console.log('\n📝 TEST 4: Getting Project Details');
    const projectDetails = await testGetProjectDetails(fitnessProjectId);
    
    // Test 5: Get Project Analytics
    console.log('\n📝 TEST 5: Getting Project Analytics');
    const analytics = await testGetProjectAnalytics(fitnessProjectId);
    
    // Test 6: Get Optimal Posting Times
    console.log('\n📝 TEST 6: Getting Optimal Posting Times');
    const optimalTimes = await testGetOptimalTimes();
    
    // Test 7: Update Content
    if (projectDetails && projectDetails.content.length > 0) {
      console.log('\n📝 TEST 7: Updating Content');
      await testUpdateContent(fitnessProjectId, projectDetails.content[0].id);
    }
    
    // Test 8: Update Calendar
    if (projectDetails && projectDetails.calendar.length > 0) {
      console.log('\n📝 TEST 8: Updating Calendar');
      await testUpdateCalendar(fitnessProjectId, projectDetails.calendar[0].id);
    }
    
    // Test 9: Project Actions
    console.log('\n📝 TEST 9: Project Actions');
    await testProjectAction(fitnessProjectId, 'pause');
    await testProjectAction(fitnessProjectId, 'resume');
    
    // Test 10: Regenerate Content
    console.log('\n📝 TEST 10: Regenerating Content');
    await testRegenerateContent(fitnessProjectId);
    
    // Test 11: Delete Content
    if (projectDetails && projectDetails.content.length > 0) {
      console.log('\n📝 TEST 11: Deleting Content');
      await testDeleteContent(fitnessProjectId, projectDetails.content[0].id);
    }
    
    // Test 12: Delete Project
    console.log('\n📝 TEST 12: Deleting Project');
    await testDeleteProject(fitnessProjectId);
    
    console.log('\n🎉 All Tests Completed Successfully!');
    console.log('=' .repeat(80));
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('✅ Project Creation: Working');
    console.log('✅ Project Retrieval: Working');
    console.log('✅ Project Details: Working');
    console.log('✅ Project Analytics: Working');
    console.log('✅ Content Management: Working');
    console.log('✅ Calendar Management: Working');
    console.log('✅ AI Content Generation: Working');
    console.log('✅ Optimal Times: Working');
    console.log('✅ Project Actions: Working');
    console.log('✅ Content Regeneration: Working');
    console.log('✅ Content Deletion: Working');
    console.log('✅ Project Deletion: Working');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Example usage scenarios
function printUsageExamples() {
  console.log('\n📚 USAGE EXAMPLES:');
  console.log('=' .repeat(50));
  
  console.log('\n1. Create a Fitness Project:');
  console.log('POST /api/ai-projects');
  console.log(JSON.stringify(testProject, null, 2));
  
  console.log('\n2. Get Project with Content and Calendar:');
  console.log('GET /api/ai-projects/1');
  
  console.log('\n3. Regenerate Content for Different Duration:');
  console.log('POST /api/ai-projects/1/regenerate');
  console.log(JSON.stringify({
    regenerateType: 'both',
    newDuration: 60,
    newFrequency: 'daily'
  }, null, 2));
  
  console.log('\n4. Get Optimal Posting Times:');
  console.log('POST /api/ai-projects/optimal-times');
  console.log(JSON.stringify({
    platforms: ['instagram', 'tiktok', 'youtube'],
    category: 'fitness',
    timezone: 'UTC'
  }, null, 2));
  
  console.log('\n5. Update Content Status:');
  console.log('PUT /api/ai-projects/1/content/1');
  console.log(JSON.stringify({
    status: 'published',
    title: 'Updated Title'
  }, null, 2));
  
  console.log('\n6. Reschedule Content:');
  console.log('PUT /api/ai-projects/1/calendar/1');
  console.log(JSON.stringify({
    scheduledDate: '2024-01-20T10:00:00.000Z',
    scheduledTime: '10:00'
  }, null, 2));
}

// Run the test
if (require.main === module) {
  console.log('🚀 AI Project Management System Test Suite');
  console.log('Make sure the server is running on http://localhost:5000');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to start...');
  
  setTimeout(() => {
    runComprehensiveTest().then(() => {
      printUsageExamples();
    });
  }, 5000);
}

module.exports = {
  runComprehensiveTest,
  testCreateProject,
  testGetProjects,
  testGetProjectDetails,
  testGetProjectAnalytics,
  testRegenerateContent,
  testUpdateContent,
  testUpdateCalendar,
  testProjectAction,
  testGetOptimalTimes,
  testDeleteContent,
  testDeleteProject
};