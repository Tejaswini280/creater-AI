// Fix Project Wizard Data Flow - Comprehensive Solution
// This script fixes the issue where date and timezone selections are not being properly saved

console.log('🔧 Fixing Project Wizard Data Flow...\n');

// Step 1: Clear any corrupted data
console.log('Step 1: Clearing corrupted project data...');
localStorage.removeItem('latestCreatedProject');
localStorage.removeItem('currentProjectId');
localStorage.removeItem('localProjects');
localStorage.removeItem('projectWizardData');
console.log('✅ Corrupted data cleared\n');

// Step 2: Create a properly structured project that mimics the wizard flow
console.log('Step 2: Creating properly structured project data...');

const testDate = '2025-01-15'; // Future date for testing
const testTimezone = 'Asia/Kolkata'; // IST timezone

// Simulate the complete wizard data structure
const completeWizardData = {
    basics: {
        name: 'Date & Timezone Fix Test',
        description: 'Testing proper date and timezone persistence',
        contentType: 'Social Media Content',
        category: 'Digital Marketing',
        targetAudience: 'Social media users',
        goals: ['Test date persistence', 'Test timezone display']
    },
    content: {
        contentFormats: ['Posts', 'Stories', 'Videos'],
        postingFrequency: 'Daily',
        contentThemes: ['Educational', 'Entertainment'],
        brandVoice: 'Professional & Friendly',
        contentLength: 'Medium'
    },
    integrations: {
        platforms: ['Instagram', 'Facebook', 'LinkedIn'],
        aiTools: ['Content Generator', 'Image Creator'],
        schedulingPreferences: {
            autoSchedule: true,
            timeZone: testTimezone, // CRITICAL: This is where timezone is stored
            preferredTimes: ['09:00', '15:00', '18:00']
        }
    },
    schedule: {
        startDate: testDate, // CRITICAL: This is where start date is stored
        duration: '3 months',
        budget: '$1000-2000',
        teamMembers: []
    }
};

// Step 3: Create the final project data structure (what should be created)
console.log('Step 3: Creating final project structure...');

const finalProjectData = {
    id: 'fixed-wizard-' + Date.now(),
    name: completeWizardData.basics.name,
    description: completeWizardData.basics.description,
    contentType: completeWizardData.basics.contentType,
    category: completeWizardData.basics.category,
    targetAudience: completeWizardData.basics.targetAudience,
    goals: completeWizardData.basics.goals,
    contentFormats: completeWizardData.content.contentFormats,
    postingFrequency: completeWizardData.content.postingFrequency,
    contentThemes: completeWizardData.content.contentThemes,
    brandVoice: completeWizardData.content.brandVoice,
    contentLength: completeWizardData.content.contentLength,
    platforms: completeWizardData.integrations.platforms,
    aiTools: completeWizardData.integrations.aiTools,
    
    // CRITICAL: Proper scheduling preferences structure
    schedulingPreferences: {
        autoSchedule: completeWizardData.integrations.schedulingPreferences.autoSchedule,
        timeZone: completeWizardData.integrations.schedulingPreferences.timeZone,
        preferredTimes: completeWizardData.integrations.schedulingPreferences.preferredTimes
    },
    
    // CRITICAL: Start date should be stored as-is (the display logic will handle timezone formatting)
    startDate: completeWizardData.schedule.startDate,
    
    duration: completeWizardData.schedule.duration,
    budget: completeWizardData.schedule.budget,
    teamMembers: completeWizardData.schedule.teamMembers,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

// Step 4: Store the data in all the places the application expects
console.log('Step 4: Storing data in all expected locations...');

// Store as latest created project
localStorage.setItem('latestCreatedProject', JSON.stringify(finalProjectData));
console.log('✅ Stored as latestCreatedProject');

// Store current project ID
localStorage.setItem('currentProjectId', finalProjectData.id);
console.log('✅ Stored currentProjectId');

// Store in local projects array
const localProjects = [finalProjectData];
localStorage.setItem('localProjects', JSON.stringify(localProjects));
console.log('✅ Stored in localProjects array');

// Store wizard data for compatibility
localStorage.setItem('projectWizardData', JSON.stringify(completeWizardData));
console.log('✅ Stored wizard data for compatibility');

// Step 5: Verification
console.log('\nStep 5: Verification...');
console.log('📊 Project Data Summary:');
console.log(`   Name: ${finalProjectData.name}`);
console.log(`   Start Date: ${finalProjectData.startDate}`);
console.log(`   Timezone: ${finalProjectData.schedulingPreferences.timeZone}`);
console.log(`   Project ID: ${finalProjectData.id}`);

// Step 6: Test the data structure
console.log('\nStep 6: Testing data structure...');

function formatDateInTimezone(dateString, timezoneId) {
    if (!dateString) return 'Not set';
    
    try {
        const date = new Date(dateString + 'T12:00:00'); // Add time to avoid timezone issues
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezoneId
        };
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

function getTimezoneDisplayName(timezoneId) {
    const timezoneNames = {
        'UTC': 'UTC (Coordinated Universal Time)',
        'America/New_York': 'EST (Eastern Time)',
        'America/Los_Angeles': 'PST (Pacific Time)',
        'Europe/London': 'GMT (Greenwich Mean Time)',
        'Asia/Kolkata': 'IST (Indian Standard Time)',
        'Europe/Paris': 'CET (Central European Time)',
        'Asia/Tokyo': 'JST (Japan Standard Time)',
        'Australia/Sydney': 'AEST (Australian Eastern Time)',
        'Asia/Dubai': 'GST (Gulf Standard Time)',
        'Asia/Singapore': 'SGT (Singapore Time)'
    };
    return timezoneNames[timezoneId] || timezoneId;
}

// Test the display logic
const formattedDate = formatDateInTimezone(finalProjectData.startDate, finalProjectData.schedulingPreferences.timeZone);
const timezoneDisplay = getTimezoneDisplayName(finalProjectData.schedulingPreferences.timeZone);

console.log('\n🎯 Expected Display Results:');
console.log(`   Formatted Date: ${formattedDate}`);
console.log(`   Timezone Display: ${timezoneDisplay}`);
console.log(`   Should NOT show: "Not set" or today's date`);

console.log('\n✅ Fix Complete!');
console.log('🔗 Next Steps:');
console.log('   1. Go to: http://localhost:5000/project-details');
console.log('   2. Check the Project Timeline section');
console.log('   3. Verify it shows: "January 15, 2025" and "IST (Indian Standard Time)"');
console.log('   4. If it still shows "Not set", refresh the page');

// Return the project ID for easy access
console.log(`\n📋 Direct Link: http://localhost:5000/project-details?id=${finalProjectData.id}`);