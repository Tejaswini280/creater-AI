/**
 * Debug script to test project page functionality
 * This will help identify why the project page is not displaying content
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Project Page Issues\n');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5000',
  projectId: '1' // Test with project ID 1
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function testBackendEndpoints() {
  log('Testing backend API endpoints...');
  
  // Check if backend is accessible
  const http = require('http');
  
  // Test project details endpoint
  const projectOptions = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${TEST_CONFIG.projectId}`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  };
  
  const projectReq = http.request(projectOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        log(`Project endpoint response (${res.statusCode}):`, 'info');
        console.log('Response:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 200 && response.success) {
          log('Project endpoint working correctly', 'success');
        } else {
          log(`Project endpoint returned error: ${response.message || 'Unknown error'}`, 'error');
        }
      } catch (e) {
        log(`Failed to parse project response: ${e.message}`, 'error');
        console.log('Raw response:', data);
      }
    });
  });
  
  projectReq.on('error', (e) => {
    log(`Project endpoint request failed: ${e.message}`, 'error');
  });
  
  projectReq.end();
  
  // Test project content endpoint
  const contentOptions = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/projects/${TEST_CONFIG.projectId}/content`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  };
  
  const contentReq = http.request(contentOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        log(`Project content endpoint response (${res.statusCode}):`, 'info');
        console.log('Response:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 200 && response.success) {
          log(`Project content endpoint working correctly. Found ${response.content?.length || 0} content items`, 'success');
        } else {
          log(`Project content endpoint returned error: ${response.message || 'Unknown error'}`, 'error');
        }
      } catch (e) {
        log(`Failed to parse content response: ${e.message}`, 'error');
        console.log('Raw response:', data);
      }
    });
  });
  
  contentReq.on('error', (e) => {
    log(`Content endpoint request failed: ${e.message}`, 'error');
  });
  
  contentReq.end();
}

function testDatabaseState() {
  log('Checking database state...');
  
  // Check if there are any projects in the database
  const dbPath = path.join(__dirname, 'shared', 'schema.ts');
  if (fs.existsSync(dbPath)) {
    log('Database schema file exists', 'success');
    
    // Check if there are any test projects or content
    const testProjectsPath = path.join(__dirname, 'create-test-projects.js');
    if (fs.existsSync(testProjectsPath)) {
      log('Test projects script exists - you may need to run it to create test data', 'info');
    }
  } else {
    log('Database schema file not found', 'error');
  }
}

function testFrontendRouting() {
  log('Checking frontend routing...');
  
  // Check if project route is properly configured
  const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    const hasProjectRoute = appContent.includes('/project/:id');
    const hasProjectComponent = appContent.includes('Project');
    
    if (hasProjectRoute && hasProjectComponent) {
      log('Project route properly configured in App.tsx', 'success');
    } else {
      log('Project route not properly configured in App.tsx', 'error');
    }
  } else {
    log('App.tsx not found', 'error');
  }
  
  // Check if project page component exists
  const projectPagePath = path.join(__dirname, 'client', 'src', 'pages', 'project.tsx');
  if (fs.existsSync(projectPagePath)) {
    log('Project page component exists', 'success');
    
    // Check for common issues
    const projectContent = fs.readFileSync(projectPagePath, 'utf8');
    const hasContentQuery = projectContent.includes('project-content');
    const hasProjectQuery = projectContent.includes('project');
    const hasContentFiltering = projectContent.includes('filteredContent');
    
    if (hasContentQuery && hasProjectQuery && hasContentFiltering) {
      log('Project page component has all required functionality', 'success');
    } else {
      log('Project page component missing required functionality', 'error');
    }
  } else {
    log('Project page component not found', 'error');
  }
}

function provideSolutions() {
  log('Providing solutions for common issues...');
  
  console.log('\n🔧 Common Issues and Solutions:');
  console.log('1. No projects in database: Run create-test-projects.js to create test data');
  console.log('2. Authentication issues: Check if JWT tokens are being sent correctly');
  console.log('3. CORS issues: Ensure backend allows requests from frontend');
  console.log('4. Database connection: Verify database is running and accessible');
  console.log('5. API endpoint errors: Check backend logs for specific error messages');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Check backend logs for API errors');
  console.log('3. Verify project ID in URL is valid');
  console.log('4. Ensure user is authenticated');
  console.log('5. Check if content exists for the project');
}

// Run all tests
async function runDebugTests() {
  try {
    log('Starting comprehensive debugging...');
    
    testBackendEndpoints();
    
    // Wait a bit for HTTP requests to complete
    setTimeout(() => {
      testDatabaseState();
      testFrontendRouting();
      provideSolutions();
      
      log('Debugging complete. Check the output above for issues.', 'success');
    }, 2000);
    
  } catch (error) {
    log(`Debug test failed: ${error.message}`, 'error');
  }
}

// Run the debug tests
runDebugTests();
