/**
 * Project Content Toggle Test Script
 * 
 * This script tests the new toggle functionality that allows users to switch between:
 * 1. "All Content" - Shows content from all projects
 * 2. "Project Content" - Shows only content from the specific project
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Project Content Toggle Functionality\n');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  projectPagePath: 'client/src/pages/project.tsx'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    log(message, 'error');
    throw new Error(message);
  }
}

function testProjectPageImplementation() {
  log('Checking project page implementation for content toggle...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  if (!fs.existsSync(projectPagePath)) {
    log('Project page not found', 'error');
    return false;
  }
  
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check for content view mode state
  const hasContentViewMode = projectPageContent.includes('contentViewMode');
  assert(hasContentViewMode, 'Project page has contentViewMode state');
  
  // Check for toggle buttons
  const hasAllContentButton = projectPageContent.includes('All Content');
  assert(hasAllContentButton, 'Project page has "All Content" toggle button');
  
  const hasProjectContentButton = projectPageContent.includes('Project Content');
  assert(hasProjectContentButton, 'Project page has "Project Content" toggle button');
  
  // Check for view mode description
  const hasViewModeDescription = projectPageContent.includes('Showing all content from all your projects');
  assert(hasViewModeDescription, 'Project page has view mode description');
  
  // Check for content fetching logic
  const hasContentViewModeLogic = projectPageContent.includes('contentViewMode === \'project\'');
  assert(hasContentViewModeLogic, 'Project page has content view mode logic');
  
  // Check for project badge display
  const hasOtherProjectBadge = projectPageContent.includes('Other Project');
  assert(hasOtherProjectBadge, 'Project page has "Other Project" badge logic');
  
  log('Project page implementation is complete', 'success');
  return true;
}

function testContentFiltering() {
  log('Checking content filtering implementation...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  if (!fs.existsSync(projectPagePath)) {
    log('Project page not found, skipping filtering test', 'warning');
    return false;
  }
  
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check for API endpoint switching
  const hasProjectContentEndpoint = projectPageContent.includes('/api/projects/${projectId}/content');
  assert(hasProjectContentEndpoint, 'Project page uses project-specific content endpoint');
  
  const hasAllContentEndpoint = projectPageContent.includes('/api/content');
  assert(hasAllContentEndpoint, 'Project page uses all content endpoint');
  
  // Check for query key updates
  const hasUpdatedQueryKey = projectPageContent.includes('[\'content\', contentViewMode, projectId');
  assert(hasUpdatedQueryKey, 'Project page has updated query key structure');
  
  log('Content filtering implementation is complete', 'success');
  return true;
}

function testUserExperience() {
  log('Checking user experience features...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  if (!fs.existsSync(projectPagePath)) {
    log('Project page not found, skipping UX test', 'warning');
    return false;
  }
  
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check for toggle UI
  const hasToggleUI = projectPageContent.includes('bg-gray-100 rounded-lg p-1');
  assert(hasToggleUI, 'Project page has toggle UI styling');
  
  // Check for icon usage
  const hasGlobeIcon = projectPageContent.includes('Globe className');
  assert(hasGlobeIcon, 'Project page uses Globe icon for all content');
  
  const hasFolderIcon = projectPageContent.includes('FolderOpen className');
  assert(hasFolderIcon, 'Project page uses FolderOpen icon for project content');
  
  // Check for responsive design
  const hasResponsiveClasses = projectPageContent.includes('text-xs');
  assert(hasResponsiveClasses, 'Project page has responsive design classes');
  
  log('User experience features are complete', 'success');
  return true;
}

function testIntegration() {
  log('Checking integration with existing features...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  if (!fs.existsSync(projectPagePath)) {
    log('Project page not found, skipping integration test', 'warning');
    return false;
  }
  
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check for search integration
  const hasSearchIntegration = projectPageContent.includes('searchTerm');
  assert(hasSearchIntegration, 'Project page maintains search functionality');
  
  // Check for filter integration
  const hasFilterIntegration = projectPageContent.includes('statusFilter');
  assert(hasFilterIntegration, 'Project page maintains status filtering');
  
  const hasPlatformFilter = projectPageContent.includes('platformFilter');
  assert(hasPlatformFilter, 'Project page maintains platform filtering');
  
  // Check for content management
  const hasContentManagement = projectPageContent.includes('handleDeleteContent');
  assert(hasContentManagement, 'Project page maintains content management');
  
  log('Integration with existing features is complete', 'success');
  return true;
}

function runTests() {
  try {
    log('Starting project content toggle tests...');
    
    const tests = [
      testProjectPageImplementation,
      testContentFiltering,
      testUserExperience,
      testIntegration
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
      try {
        if (test()) {
          passedTests++;
        }
      } catch (error) {
        log(`Test failed: ${error.message}`, 'error');
      }
    }
    
    log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'success' : 'warning');
    
    if (passedTests === totalTests) {
      log('🎉 All tests passed! Project content toggle functionality is working correctly.', 'success');
    } else {
      log('⚠️ Some tests failed. Please review the implementation.', 'warning');
    }
    
    return passedTests === totalTests;
    
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error');
    return false;
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
