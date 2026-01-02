#!/usr/bin/env node

/**
 * Debug Project Routing
 * Tests if the project creation routing is working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Project Routing...\n');

// Check if project wizard file exists
const projectWizardPath = path.join(__dirname, 'client/src/pages/project-wizard.tsx');
const appPath = path.join(__dirname, 'client/src/App.tsx');
const dashboardPath = path.join(__dirname, 'client/src/pages/dashboard.tsx');
const quickActionsPath = path.join(__dirname, 'client/src/components/dashboard/QuickActions.tsx');

console.log('📁 Checking file existence:');
console.log(`✅ Project Wizard: ${fs.existsSync(projectWizardPath) ? 'EXISTS' : '❌ MISSING'}`);
console.log(`✅ App.tsx: ${fs.existsSync(appPath) ? 'EXISTS' : '❌ MISSING'}`);
console.log(`✅ Dashboard: ${fs.existsSync(dashboardPath) ? 'EXISTS' : '❌ MISSING'}`);
console.log(`✅ QuickActions: ${fs.existsSync(quickActionsPath) ? 'EXISTS' : '❌ MISSING'}\n`);

// Check App.tsx for project wizard route
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  const hasProjectWizardImport = appContent.includes('project-wizard');
  const hasProjectWizardRoute = appContent.includes('/project-wizard');
  
  console.log('🔗 App.tsx Route Configuration:');
  console.log(`✅ Project Wizard Import: ${hasProjectWizardImport ? 'FOUND' : '❌ MISSING'}`);
  console.log(`✅ Project Wizard Route: ${hasProjectWizardRoute ? 'FOUND' : '❌ MISSING'}\n`);
}

// Check Dashboard for correct routing
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const hasOldRouting = dashboardContent.includes('/new-project-enhanced');
  const hasNewRouting = dashboardContent.includes('/project-wizard');
  
  console.log('🏠 Dashboard Routing:');
  console.log(`❌ Old Routing (/new-project-enhanced): ${hasOldRouting ? 'FOUND (NEEDS FIX)' : 'NOT FOUND (GOOD)'}`);
  console.log(`✅ New Routing (/project-wizard): ${hasNewRouting ? 'FOUND' : '❌ MISSING'}\n`);
}

// Check QuickActions for correct routing
if (fs.existsSync(quickActionsPath)) {
  const quickActionsContent = fs.readFileSync(quickActionsPath, 'utf8');
  const hasOldRouting = quickActionsContent.includes('/new-project-enhanced');
  const hasNewRouting = quickActionsContent.includes('/project-wizard');
  
  console.log('⚡ QuickActions Routing:');
  console.log(`❌ Old Routing (/new-project-enhanced): ${hasOldRouting ? 'FOUND (NEEDS FIX)' : 'NOT FOUND (GOOD)'}`);
  console.log(`✅ New Routing (/project-wizard): ${hasNewRouting ? 'FOUND' : '❌ MISSING'}\n`);
}

// Check project wizard content
if (fs.existsSync(projectWizardPath)) {
  const wizardContent = fs.readFileSync(projectWizardPath, 'utf8');
  const hasSteps = wizardContent.includes('currentStep');
  const hasValidation = wizardContent.includes('zodResolver');
  const hasNavigation = wizardContent.includes('handleNext');
  
  console.log('🧙 Project Wizard Features:');
  console.log(`✅ Step Management: ${hasSteps ? 'IMPLEMENTED' : '❌ MISSING'}`);
  console.log(`✅ Form Validation: ${hasValidation ? 'IMPLEMENTED' : '❌ MISSING'}`);
  console.log(`✅ Navigation: ${hasNavigation ? 'IMPLEMENTED' : '❌ MISSING'}\n`);
}

// Generate summary
console.log('📋 SUMMARY:');
console.log('='.repeat(50));

const issues = [];
const successes = [];

// Check for issues
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  if (dashboardContent.includes('/new-project-enhanced')) {
    issues.push('Dashboard still has old routing to /new-project-enhanced');
  } else if (dashboardContent.includes('/project-wizard')) {
    successes.push('Dashboard correctly routes to /project-wizard');
  }
}

if (fs.existsSync(quickActionsPath)) {
  const quickActionsContent = fs.readFileSync(quickActionsPath, 'utf8');
  if (quickActionsContent.includes('/new-project-enhanced')) {
    issues.push('QuickActions still has old routing to /new-project-enhanced');
  } else if (quickActionsContent.includes('/project-wizard')) {
    successes.push('QuickActions correctly routes to /project-wizard');
  }
}

if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  if (appContent.includes('/project-wizard')) {
    successes.push('App.tsx has project wizard route configured');
  } else {
    issues.push('App.tsx missing project wizard route');
  }
}

if (fs.existsSync(projectWizardPath)) {
  successes.push('Project wizard component exists');
} else {
  issues.push('Project wizard component missing');
}

// Display results
if (successes.length > 0) {
  console.log('✅ WORKING CORRECTLY:');
  successes.forEach(success => console.log(`   • ${success}`));
  console.log('');
}

if (issues.length > 0) {
  console.log('❌ ISSUES FOUND:');
  issues.forEach(issue => console.log(`   • ${issue}`));
  console.log('');
}

if (issues.length === 0) {
  console.log('🎉 ALL ROUTING CONFIGURED CORRECTLY!');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Start your React development server');
  console.log('   2. Navigate to /dashboard');
  console.log('   3. Click "New Project" button');
  console.log('   4. Verify it goes to /project-wizard');
  console.log('   5. Test the 4-step wizard flow');
} else {
  console.log('🔧 FIXES NEEDED:');
  console.log('   1. Update any remaining old routes');
  console.log('   2. Ensure project wizard is properly imported');
  console.log('   3. Test the routing manually');
}

console.log('\n🧪 Test URLs:');
console.log('   • Dashboard: http://localhost:3000/dashboard');
console.log('   • Project Wizard: http://localhost:3000/project-wizard');
console.log('   • Trend Analysis: http://localhost:3000/trend-analysis');
console.log('   • Test Page: test-project-routing.html');

console.log('\n✅ Debug complete!');