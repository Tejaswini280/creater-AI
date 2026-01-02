const fs = require('fs');

console.log('🔍 Testing Project Details Data Fix...\n');

// Test the updated transformWizardData function
function transformWizardData(wizardData) {
  // Check if this is already a properly formatted ProjectData object
  if (wizardData.id && wizardData.createdAt && wizardData.schedulingPreferences && !wizardData.basics) {
    // This is already a ProjectData object from localStorage, return as-is
    console.log('Data is already in ProjectData format, using directly:', wizardData.name || 'No name');
    return wizardData;
  }

  // This is wizard step data that needs transformation
  console.log('Transforming wizard step data:', wizardData.basics?.name || wizardData.name || 'No name');
  return {
    id: wizardData.id || Date.now().toString(),
    name: wizardData.projectName || wizardData.name || wizardData.basics?.name || 'Untitled Project',
    description: wizardData.description || wizardData.projectDescription || wizardData.basics?.description || 'A comprehensive social media project designed to boost engagement and reach.',
    contentType: wizardData.contentType || wizardData.projectType || wizardData.basics?.contentType || 'Social Media Content',
    category: wizardData.category || wizardData.niche || wizardData.basics?.category || 'Digital Marketing',
    targetAudience: wizardData.targetAudience || wizardData.audience || wizardData.basics?.targetAudience || 'General audience interested in engaging content',
    goals: wizardData.goals || wizardData.objectives || wizardData.basics?.goals || ['Increase Engagement', 'Build Brand Awareness', 'Drive Traffic'],
    contentFormats: wizardData.contentFormats || wizardData.formats || wizardData.content?.contentFormats || ['Posts', 'Images', 'Stories', 'Videos'],
    postingFrequency: wizardData.postingFrequency || wizardData.frequency || wizardData.content?.postingFrequency || 'Daily',
    contentThemes: wizardData.contentThemes || wizardData.themes || wizardData.content?.contentThemes || ['Educational', 'Entertainment', 'Behind the Scenes'],
    brandVoice: wizardData.brandVoice || wizardData.tone || wizardData.content?.brandVoice || 'Professional & Friendly',
    contentLength: wizardData.contentLength || wizardData.content?.contentLength || 'Medium',
    platforms: wizardData.platforms || wizardData.socialPlatforms || wizardData.integrations?.platforms || ['Instagram', 'Facebook', 'LinkedIn'],
    aiTools: wizardData.aiTools || wizardData.integrations?.aiTools || ['Content Generator', 'Image Creator', 'Hashtag Optimizer'],
    schedulingPreferences: {
      autoSchedule: wizardData.autoSchedule !== undefined ? wizardData.autoSchedule : (wizardData.integrations?.schedulingPreferences?.autoSchedule !== undefined ? wizardData.integrations.schedulingPreferences.autoSchedule : true),
      timeZone: wizardData.timeZone || wizardData.integrations?.schedulingPreferences?.timeZone || 'UTC',
      preferredTimes: wizardData.preferredTimes || wizardData.integrations?.schedulingPreferences?.preferredTimes || ['09:00', '15:00', '18:00']
    },
    startDate: wizardData.startDate || wizardData.schedule?.startDate || null,
    duration: wizardData.duration || wizardData.timeline || wizardData.schedule?.duration || '3 months',
    budget: wizardData.budget || wizardData.schedule?.budget || '$500-1000',
    teamMembers: wizardData.teamMembers || wizardData.schedule?.teamMembers || [],
    status: wizardData.status || 'draft',
    createdAt: wizardData.createdAt || new Date().toISOString(),
    updatedAt: wizardData.updatedAt || new Date().toISOString()
  };
}

// Test 1: Properly saved project data (should NOT be transformed)
console.log('✅ Test 1: Saved project data (should preserve original values)');
const savedProjectData = {
  id: 'project_123',
  name: 'My Indian Campaign',
  description: 'Campaign for Indian market',
  contentType: 'Social Media Content',
  category: 'Marketing',
  schedulingPreferences: {
    autoSchedule: true,
    timeZone: 'Asia/Kolkata',
    preferredTimes: ['09:00', '15:00', '18:00']
  },
  startDate: '2025-12-31',
  duration: '6 months',
  createdAt: '2025-12-30T06:00:00.000Z',
  updatedAt: '2025-12-30T06:00:00.000Z'
};

const result1 = transformWizardData(savedProjectData);
console.log(`  Name: "${result1.name}" (should be "My Indian Campaign")`);
console.log(`  Start Date: ${result1.startDate} (should be "2025-12-31")`);
console.log(`  Timezone: ${result1.schedulingPreferences.timeZone} (should be "Asia/Kolkata")`);
console.log(`  Duration: ${result1.duration} (should be "6 months")`);

const test1Pass = result1.name === 'My Indian Campaign' && 
                 result1.startDate === '2025-12-31' && 
                 result1.schedulingPreferences.timeZone === 'Asia/Kolkata' &&
                 result1.duration === '6 months';
console.log(`  Result: ${test1Pass ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 2: Wizard step data (should be transformed)
console.log('✅ Test 2: Wizard step data (should be transformed)');
const wizardStepData = {
  basics: {
    name: 'My Wizard Project',
    description: 'From wizard steps',
    contentType: 'Blog Content',
    category: 'Education'
  },
  integrations: {
    schedulingPreferences: {
      timeZone: 'Asia/Kolkata'
    }
  },
  schedule: {
    startDate: '2025-12-31',
    duration: '4 months'
  }
};

const result2 = transformWizardData(wizardStepData);
console.log(`  Name: "${result2.name}" (should be "My Wizard Project")`);
console.log(`  Start Date: ${result2.startDate} (should be "2025-12-31")`);
console.log(`  Timezone: ${result2.schedulingPreferences.timeZone} (should be "Asia/Kolkata")`);
console.log(`  Duration: ${result2.duration} (should be "4 months")`);

const test2Pass = result2.name === 'My Wizard Project' && 
                 result2.startDate === '2025-12-31' && 
                 result2.schedulingPreferences.timeZone === 'Asia/Kolkata' &&
                 result2.duration === '4 months';
console.log(`  Result: ${test2Pass ? '✅ PASSED' : '❌ FAILED'}\n`);

// Test 3: Empty/minimal data (should use defaults)
console.log('✅ Test 3: Empty data (should use defaults)');
const emptyData = {};

const result3 = transformWizardData(emptyData);
console.log(`  Name: "${result3.name}" (should be "Untitled Project")`);
console.log(`  Start Date: ${result3.startDate} (should be null)`);
console.log(`  Timezone: ${result3.schedulingPreferences.timeZone} (should be "UTC")`);

const test3Pass = result3.name === 'Untitled Project' && 
                 result3.startDate === null && 
                 result3.schedulingPreferences.timeZone === 'UTC';
console.log(`  Result: ${test3Pass ? '✅ PASSED' : '❌ FAILED'}\n`);

// Summary
console.log('🎯 Test Summary:');
console.log(`  Test 1 (Saved data preservation): ${test1Pass ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`  Test 2 (Wizard data transformation): ${test2Pass ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`  Test 3 (Default handling): ${test3Pass ? '✅ PASSED' : '❌ FAILED'}`);

const allTestsPass = test1Pass && test2Pass && test3Pass;
console.log(`\n🏆 Overall Result: ${allTestsPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allTestsPass) {
  console.log('\n🎉 The fix should now correctly:');
  console.log('  1. Preserve project titles from saved data');
  console.log('  2. Preserve selected dates (31/12/2025)');
  console.log('  3. Preserve timezone selections (Asia/Kolkata)');
  console.log('  4. Only transform wizard step data when needed');
} else {
  console.log('\n❌ Some issues remain - check the transformation logic');
}

console.log('\n🚀 Next: Test the actual application with a real project creation flow!');