/**
 * Quick script to add test projects and content
 * This will help test the project page functionality
 */

console.log('🚀 Adding quick test data for project page testing...');

// Simple test data
const testProjects = [
  {
    id: 1,
    name: "Project 1",
    description: "First content",
    type: "video",
    tags: ["video", "content"],
    createdAt: new Date().toISOString()
  }
];

const testContent = [
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
  }
];

// Store in localStorage for frontend testing
if (typeof window !== 'undefined') {
  // Frontend environment
  localStorage.setItem('localProjects', JSON.stringify(testProjects));
  localStorage.setItem('localContent', JSON.stringify(testContent));
  console.log('✅ Test data stored in localStorage');
} else {
  // Node.js environment
  console.log('📋 Test data ready for database insertion:');
  console.log('Projects:', JSON.stringify(testProjects, null, 2));
  console.log('Content:', JSON.stringify(testContent, null, 2));
  console.log('\n💡 To use this data:');
  console.log('1. Copy the projects data to your database');
  console.log('2. Copy the content data to your database');
  console.log('3. Ensure projectId links content to projects');
}

console.log('🎯 Next steps:');
console.log('1. Navigate to /dashboard to see "Project 1"');
console.log('2. Click "Open Project" button');
console.log('3. You should see the project page with content');
console.log('4. Check browser console for any errors');
