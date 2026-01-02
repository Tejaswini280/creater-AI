/**
 * Quick setup script to create test projects and content
 * This will fix the 404 error by adding test data to the database
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up test data to fix 404 errors...\n');

// Test data structure
const testData = {
  projects: [
    {
      id: 1,
      name: "Project 1",
      description: "First content",
      type: "video",
      tags: ["video", "content"],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Project 2", 
      description: "Second project",
      type: "campaign",
      tags: ["campaign", "marketing"],
      createdAt: new Date().toISOString()
    }
  ],
  content: [
    {
      id: 1,
      title: "Sample Video Content",
      description: "This is a test video content for Project 1",
      platform: "youtube",
      contentType: "video",
      status: "draft",
      projectId: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: "Instagram Post",
      description: "Test Instagram post for Project 1",
      platform: "instagram",
      contentType: "post",
      status: "published",
      projectId: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      title: "Facebook Campaign",
      description: "Marketing campaign for Project 2",
      platform: "facebook",
      contentType: "campaign",
      status: "scheduled",
      projectId: 2,
      createdAt: new Date().toISOString()
    }
  ]
};

// Function to create test data in localStorage (for frontend testing)
function createLocalStorageData() {
  console.log('📱 Creating localStorage test data...');
  
  const localStorageScript = `
// Run this in browser console to create test data
localStorage.setItem('localProjects', '${JSON.stringify(testData.projects)}');
localStorage.setItem('localContent', '${JSON.stringify(testData.content)}');
console.log('✅ Test data created in localStorage');
console.log('Projects:', JSON.parse(localStorage.getItem('localProjects')));
console.log('Content:', JSON.parse(localStorage.getItem('localContent')));
  `;
  
  console.log('📋 Copy and paste this code in your browser console:');
  console.log('='.repeat(60));
  console.log(localStorageScript);
  console.log('='.repeat(60));
}

// Function to create database setup script
function createDatabaseScript() {
  console.log('\n🗄️ Creating database setup script...');
  
  const dbScript = `
-- Database setup script for test data
-- Run this in your database to create test projects and content

-- Insert test projects
INSERT INTO projects (id, user_id, name, description, type, tags, status, created_at, updated_at) VALUES
(1, 'test-user-id', 'Project 1', 'First content', 'video', ARRAY['video', 'content'], 'active', NOW(), NOW()),
(2, 'test-user-id', 'Project 2', 'Second project', 'campaign', ARRAY['campaign', 'marketing'], 'active', NOW(), NOW());

-- Insert test content
INSERT INTO content (id, user_id, project_id, title, description, platform, content_type, status, created_at, updated_at) VALUES
(1, 'test-user-id', 1, 'Sample Video Content', 'This is a test video content for Project 1', 'youtube', 'video', 'draft', NOW(), NOW()),
(2, 'test-user-id', 1, 'Instagram Post', 'Test Instagram post for Project 1', 'instagram', 'post', 'published', NOW(), NOW()),
(3, 'test-user-id', 2, 'Facebook Campaign', 'Marketing campaign for Project 2', 'facebook', 'campaign', 'scheduled', NOW(), NOW());
  `;
  
  const scriptPath = path.join(__dirname, 'setup-test-database.sql');
  fs.writeFileSync(scriptPath, dbScript);
  console.log(`✅ Database script created: ${scriptPath}`);
}

// Function to create a simple test endpoint
function createTestEndpoint() {
  console.log('\n🔌 Creating test endpoint for development...');
  
  const testEndpointCode = `
// Add this to your server/routes.ts file for testing
app.get('/api/test/projects', (req, res) => {
  res.json({
    success: true,
    projects: ${JSON.stringify(testData.projects, null, 2)}
  });
});

app.get('/api/test/projects/:id', (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = ${JSON.stringify(testData.projects)}.find(p => p.id === projectId);
  
  if (project) {
    res.json({
      success: true,
      project: project
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }
});

app.get('/api/test/projects/:id/content', (req, res) => {
  const projectId = parseInt(req.params.id);
  const content = ${JSON.stringify(testData.content)}.filter(c => c.projectId === projectId);
  
  res.json({
    success: true,
    content: content,
    total: content.length,
    projectId: projectId
  });
});
  `;
  
  const endpointPath = path.join(__dirname, 'test-endpoints.js');
  fs.writeFileSync(endpointPath, testEndpointCode);
  console.log(`✅ Test endpoints code created: ${endpointPath}`);
}

// Function to provide quick fix instructions
function provideQuickFix() {
  console.log('\n🎯 QUICK FIX INSTRUCTIONS:');
  console.log('1. Open your browser and go to the project page');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Copy and paste the localStorage code above');
  console.log('5. Refresh the page');
  console.log('6. You should now see "Project 1" in the dashboard');
  console.log('7. Click "Open Project" to test the project page');
  
  console.log('\n🔧 ALTERNATIVE: Use smaller project IDs');
  console.log('Instead of using large IDs like 1756114857252, use simple IDs like 1, 2, 3');
  console.log('Update your dashboard to navigate to /project/1 instead of /project/1756114857252');
}

// Run all setup functions
function runSetup() {
  try {
    createLocalStorageData();
    createDatabaseScript();
    createTestEndpoint();
    provideQuickFix();
    
    console.log('\n✅ Setup complete! Follow the instructions above to fix the 404 error.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup
runSetup();
