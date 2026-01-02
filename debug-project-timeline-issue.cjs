// Debug script to check project data and fix timeline display issue

console.log('🔍 Debugging Project Timeline Issue...\n');

// Check localStorage for project data
const latestProject = localStorage.getItem('latestCreatedProject');
const localProjects = localStorage.getItem('localProjects');

console.log('📊 LocalStorage Data:');
console.log('latestCreatedProject:', latestProject ? JSON.parse(latestProject) : 'Not found');
console.log('localProjects:', localProjects ? JSON.parse(localProjects) : 'Not found');

// Create a test project with proper date and timezone
const testProject = {
  id: 'test-timeline-fix-' + Date.now(),
  name: 'Timeline Test Project',
  description: 'Testing timezone-aware date display',
  contentType: 'Social Media Content',
  category: 'Digital Marketing',
  targetAudience: 'Test audience',
  goals: ['Test Goal'],
  contentFormats: ['Posts'],
  postingFrequency: 'Daily',
  contentThemes: ['Test Theme'],
  brandVoice: 'Professional',
  contentLength: 'Medium',
  platforms: ['Instagram'],
  aiTools: ['Content Generator'],
  schedulingPreferences: {
    autoSchedule: true,
    timeZone: 'Asia/Kolkata', // IST timezone
    preferredTimes: ['09:00', '15:00', '18:00']
  },
  startDate: '2024-12-31', // Tomorrow's date
  duration: '3 months',
  budget: '$1000-2000',
  teamMembers: [],
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('\n✅ Creating test project with proper date and timezone:');
console.log('Project Data:', JSON.stringify(testProject, null, 2));

// Store the test project
localStorage.setItem('latestCreatedProject', JSON.stringify(testProject));

// Also add to local projects array
const existingProjects = JSON.parse(localStorage.getItem('localProjects') || '[]');
existingProjects.push(testProject);
localStorage.setItem('localProjects', JSON.stringify(existingProjects));

console.log('\n🎯 Test project created and stored!');
console.log('Expected display:');
console.log('- Start Date: December 31, 2024 (in IST timezone)');
console.log('- Timezone: IST (Indian Standard Time)');
console.log('- Relative Time: Tomorrow');

console.log('\n🔄 Please refresh the project details page to see the fix!');
console.log('URL: http://localhost:5000/project-details?id=' + testProject.id);