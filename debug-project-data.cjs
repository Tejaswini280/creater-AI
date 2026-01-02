// Debug script to check what's actually stored in localStorage
console.log('🔍 Debugging Project Data Storage...\n');

// Simulate the data structure that should be saved
const sampleProjectData = {
  id: 'project_1735567200000_abc123',
  name: 'My Social Media Campaign',
  description: 'A comprehensive social media project designed to boost engagement and reach.',
  contentType: 'Social Media Content',
  category: 'Digital Marketing',
  targetAudience: 'General audience interested in engaging content',
  goals: ['Increase Engagement', 'Build Brand Awareness', 'Drive Traffic'],
  contentFormats: ['Posts', 'Images', 'Stories', 'Videos'],
  postingFrequency: 'Daily',
  contentThemes: ['Educational', 'Entertainment', 'Behind the Scenes'],
  brandVoice: 'Professional & Friendly',
  contentLength: 'Medium',
  platforms: ['Instagram', 'Facebook', 'LinkedIn'],
  aiTools: ['Content Generator', 'Image Creator', 'Hashtag Optimizer'],
  schedulingPreferences: {
    autoSchedule: true,
    timeZone: 'Asia/Kolkata',
    preferredTimes: ['09:00', '15:00', '18:00']
  },
  startDate: '2025-12-31',
  duration: '3 months',
  budget: '$500-1000',
  teamMembers: [],
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

console.log('📋 Sample Project Data Structure:');
console.log(JSON.stringify(sampleProjectData, null, 2));

console.log('\n🔧 Testing Data Transformation...');

// Test the transformWizardData function from project-details.tsx
function transformWizardData(wizardData) {
  console.log('Input wizardData:', JSON.stringify(wizardData, null, 2));
  
  const result = {
    id: wizardData.id || Date.now().toString(),
    name: wizardData.projectName || wizardData.name || wizardData.basics?.name || 'Untitled Project',
    description: wizardData.description || wizardData.projectDescription || 'A comprehensive social media project designed to boost engagement and reach.',
    contentType: wizardData.contentType || wizardData.projectType || 'Social Media Content',
    category: wizardData.category || wizardData.niche || 'Digital Marketing',
    targetAudience: wizardData.targetAudience || wizardData.audience || 'General audience interested in engaging content',
    goals: wizardData.goals || wizardData.objectives || ['Increase Engagement', 'Build Brand Awareness', 'Drive Traffic'],
    contentFormats: wizardData.contentFormats || wizardData.formats || ['Posts', 'Images', 'Stories', 'Videos'],
    postingFrequency: wizardData.postingFrequency || wizardData.frequency || 'Daily',
    contentThemes: wizardData.contentThemes || wizardData.themes || ['Educational', 'Entertainment', 'Behind the Scenes'],
    brandVoice: wizardData.brandVoice || wizardData.tone || 'Professional & Friendly',
    contentLength: wizardData.contentLength || 'Medium',
    platforms: wizardData.platforms || wizardData.socialPlatforms || ['Instagram', 'Facebook', 'LinkedIn'],
    aiTools: wizardData.aiTools || ['Content Generator', 'Image Creator', 'Hashtag Optimizer'],
    schedulingPreferences: {
      autoSchedule: wizardData.autoSchedule !== undefined ? wizardData.autoSchedule : true,
      timeZone: wizardData.timeZone || wizardData.schedulingPreferences?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      preferredTimes: wizardData.preferredTimes || wizardData.schedulingPreferences?.preferredTimes || ['09:00', '15:00', '18:00']
    },
    startDate: wizardData.startDate || wizardData.schedule?.startDate || null,
    duration: wizardData.duration || wizardData.timeline || '3 months',
    budget: wizardData.budget || '$500-1000',
    teamMembers: wizardData.teamMembers || [],
    status: wizardData.status || 'draft',
    createdAt: wizardData.createdAt || new Date().toISOString(),
    updatedAt: wizardData.updatedAt || new Date().toISOString()
  };
  
  console.log('Output result:', JSON.stringify(result, null, 2));
  return result;
}

console.log('\n✅ Test 1: Direct project data (should work)');
const result1 = transformWizardData(sampleProjectData);
console.log(`Name: "${result1.name}"`);
console.log(`Start Date: ${result1.startDate}`);
console.log(`Timezone: ${result1.schedulingPreferences.timeZone}`);

console.log('\n✅ Test 2: Empty object (should show defaults)');
const result2 = transformWizardData({});
console.log(`Name: "${result2.name}"`);
console.log(`Start Date: ${result2.startDate}`);
console.log(`Timezone: ${result2.schedulingPreferences.timeZone}`);

console.log('\n✅ Test 3: Wizard format data (nested structure)');
const wizardFormatData = {
  basics: {
    name: 'My Campaign from Wizard',
    description: 'Test description',
    contentType: 'Social Media',
    category: 'Marketing'
  },
  integrations: {
    schedulingPreferences: {
      timeZone: 'Asia/Kolkata'
    }
  },
  schedule: {
    startDate: '2025-12-31'
  }
};
const result3 = transformWizardData(wizardFormatData);
console.log(`Name: "${result3.name}"`);
console.log(`Start Date: ${result3.startDate}`);
console.log(`Timezone: ${result3.schedulingPreferences.timeZone}`);

console.log('\n🎯 Key Issues Identified:');
console.log('1. The project data from ProjectService should already be in the correct format');
console.log('2. The transformWizardData function is designed for wizard step data, not saved project data');
console.log('3. We need to check if the data is already transformed before applying transformation');

console.log('\n🔧 Recommended Fix:');
console.log('1. Check if data is already in ProjectData format (has id, createdAt, etc.)');
console.log('2. Only apply transformation if data is in wizard format');
console.log('3. Add better fallback handling for missing fields');

console.log('\n✅ Debug complete!');