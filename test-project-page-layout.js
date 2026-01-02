/**
 * Project Page Layout Verification Test
 * 
 * This script verifies that the project page layout has been updated to match the reference image:
 * 1. Create New Content section at the top
 * 2. Your Content section below
 * 3. Proper form fields and layout
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying Project Page Layout Updates\n');

// Test configuration
const TEST_CONFIG = {
  projectPagePath: 'client/src/pages/project.tsx'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    log(message, 'error');
    throw new Error(message);
  }
}

function testLayoutStructure() {
  log('Testing project page layout structure...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  if (!fs.existsSync(projectPagePath)) {
    log('Project page file not found', 'error');
    return false;
  }
  
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check if layout changed from side-by-side to vertical
  const hasVerticalLayout = projectPageContent.includes('space-y-8') && 
                           projectPageContent.includes('Top Section: Create New Content') &&
                           projectPageContent.includes('Bottom Section: Your Content');
  assert(hasVerticalLayout, 'Project page uses vertical layout with top and bottom sections');
  
  // Check if no longer uses side-by-side layout
  const hasSideBySideLayout = projectPageContent.includes('flex gap-8') && 
                             projectPageContent.includes('w-1/2');
  assert(!hasSideBySideLayout, 'Project page no longer uses side-by-side layout');
  
  log('Layout structure is correctly updated to vertical layout', 'success');
  return true;
}

function testCreateContentSection() {
  log('Testing Create New Content section...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check if Create New Content section is at the top
  const hasCreateContentTop = projectPageContent.includes('Top Section: Create New Content');
  assert(hasCreateContentTop, 'Create New Content section is positioned at the top');
  
  // Check if form has all required fields
  const hasTitleField = projectPageContent.includes('placeholder="Enter content title..."');
  assert(hasTitleField, 'Title field is present');
  
  const hasDescriptionField = projectPageContent.includes('placeholder="Describe your content..."');
  assert(hasDescriptionField, 'Description field is present');
  
  // Check if platforms use checkboxes (not radio buttons)
  const hasCheckboxPlatforms = projectPageContent.includes('type="checkbox"') && 
                               projectPageContent.includes('grid-cols-3');
  assert(hasCheckboxPlatforms, 'Platforms section uses checkboxes in 3-column grid');
  
  // Check if content types use pill buttons
  const hasPillContentTypes = projectPageContent.includes('grid-cols-4') && 
                             projectPageContent.includes('rounded-xl');
  assert(hasPillContentTypes, 'Content types use pill buttons in 4-column grid');
  
  // Check if Create Content button is present
  const hasCreateButton = projectPageContent.includes('Create Content');
  assert(hasCreateButton, 'Create Content button is present');
  
  // Check if Quick Actions section is present
  const hasQuickActions = projectPageContent.includes('Quick Actions') && 
                         projectPageContent.includes('Generate Script');
  assert(hasQuickActions, 'Quick Actions section with Generate Script button is present');
  
  log('Create New Content section is correctly implemented', 'success');
  return true;
}

function testYourContentSection() {
  log('Testing Your Content section...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check if Your Content section is below Create Content
  const hasYourContentBottom = projectPageContent.includes('Bottom Section: Your Content');
  assert(hasYourContentBottom, 'Your Content section is positioned at the bottom');
  
  // Check if platform filter is present
  const hasPlatformFilter = projectPageContent.includes('All Platforms') && 
                           projectPageContent.includes('YouTube') &&
                           projectPageContent.includes('Instagram') &&
                           projectPageContent.includes('Facebook');
  assert(hasPlatformFilter, 'Platform filter dropdown is present with correct options');
  
  // Check if search and filters are present
  const hasSearchField = projectPageContent.includes('placeholder="Search content..."');
  assert(hasSearchField, 'Search field is present');
  
  const hasStatusFilter = projectPageContent.includes('All Status');
  assert(hasStatusFilter, 'Status filter is present');
  
  // Check if empty state message is updated
  const hasEmptyStateButton = projectPageContent.includes('Create your first piece of content to get started') &&
                             projectPageContent.includes('onClick={() => window.scrollTo({ top: 0, behavior: \'smooth\' })}');
  assert(hasEmptyStateButton, 'Empty state includes Create Content button that scrolls to top');
  
  log('Your Content section is correctly implemented', 'success');
  return true;
}

function testPlatformAndContentTypeUpdates() {
  log('Testing platform and content type updates...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check if platforms array is updated
  const hasUpdatedPlatforms = projectPageContent.includes('youtube') && 
                              projectPageContent.includes('instagram') && 
                              projectPageContent.includes('facebook') &&
                              !projectPageContent.includes('twitter') &&
                              !projectPageContent.includes('tiktok');
  assert(hasUpdatedPlatforms, 'Platforms array is updated to only include YouTube, Instagram, Facebook');
  
  // Check if content types array is updated
  const hasUpdatedContentTypes = projectPageContent.includes('Video') && 
                                projectPageContent.includes('Short/Reel') && 
                                projectPageContent.includes('Image Post') && 
                                projectPageContent.includes('Text Post');
  assert(hasUpdatedContentTypes, 'Content types array is updated to match reference image');
  
  log('Platform and content type updates are correctly implemented', 'success');
  return true;
}

function testResponsiveDesign() {
  log('Testing responsive design...');
  
  const projectPagePath = path.join(__dirname, TEST_CONFIG.projectPagePath);
  const projectPageContent = fs.readFileSync(projectPagePath, 'utf8');
  
  // Check if max-width container is used
  const hasMaxWidthContainer = projectPageContent.includes('max-w-7xl mx-auto');
  assert(hasMaxWidthContainer, 'Page uses max-width container for responsive design');
  
  // Check if proper spacing is used
  const hasProperSpacing = projectPageContent.includes('space-y-8') && 
                           projectPageContent.includes('px-8 py-8');
  assert(hasProperSpacing, 'Page uses proper spacing for responsive layout');
  
  log('Responsive design is correctly implemented', 'success');
  return true;
}

function runAllTests() {
  try {
    log('Starting layout verification tests...\n');
    
    const tests = [
      testLayoutStructure,
      testCreateContentSection,
      testYourContentSection,
      testPlatformAndContentTypeUpdates,
      testResponsiveDesign
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
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      log('🎉 All tests passed! Project page layout matches reference image.', 'success');
      console.log('\n🎯 Layout Updates Summary:');
      console.log('✅ Changed from side-by-side to vertical layout');
      console.log('✅ Create New Content section positioned at top');
      console.log('✅ Your Content section positioned below');
      console.log('✅ Platforms use checkboxes (YouTube, Instagram, Facebook)');
      console.log('✅ Content types use pill buttons (Video, Short/Reel, Image Post, Text Post)');
      console.log('✅ Quick Actions section with Generate Script button');
      console.log('✅ Responsive design maintained');
      console.log('✅ Empty state includes Create Content button');
    } else {
      log('⚠️ Some tests failed. Please review the implementation.', 'warning');
    }
    
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error');
  }
}

// Run the tests
runAllTests();
