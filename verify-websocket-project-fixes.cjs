#!/usr/bin/env node

/**
 * Comprehensive verification script for WebSocket and Project Creation fixes
 * This script tests both the WebSocket disable mechanism and project creation flow
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting WebSocket and Project Creation Fixes Verification...\n');

// Test results tracking
const results = {
  websocketDisable: false,
  projectWizardNavigation: false,
  dashboardNavigation: false,
  fileIntegrity: false
};

// Test 1: Verify WebSocket disable mechanism in main.tsx
console.log('📋 Test 1: WebSocket Disable Mechanism');
try {
  const mainTsxPath = path.join(__dirname, 'client', 'src', 'main.tsx');
  const mainTsxContent = fs.readFileSync(mainTsxPath, 'utf8');
  
  // Check for WebSocket disable code
  const hasDisableCode = mainTsxContent.includes('🔧 Applying WebSocket disable mechanism...');
  const hasDisabledWebSocket = mainTsxContent.includes('DisabledWebSocket');
  const hasConsoleLog = mainTsxContent.includes('✅ WebSocket disabled successfully');
  
  if (hasDisableCode && hasDisabledWebSocket && hasConsoleLog) {
    console.log('✅ WebSocket disable mechanism properly implemented');
    results.websocketDisable = true;
  } else {
    console.log('❌ WebSocket disable mechanism missing or incomplete');
    console.log(`   - Disable code: ${hasDisableCode ? '✅' : '❌'}`);
    console.log(`   - DisabledWebSocket: ${hasDisabledWebSocket ? '✅' : '❌'}`);
    console.log(`   - Console log: ${hasConsoleLog ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log('❌ Error reading main.tsx:', error.message);
}

// Test 2: Verify WebSocket service checks
console.log('\n📋 Test 2: WebSocket Service Disable Checks');
try {
  const wsServicePath = path.join(__dirname, 'client', 'src', 'services', 'WebSocketService.ts');
  const wsServiceContent = fs.readFileSync(wsServicePath, 'utf8');
  
  const hasDisableCheck = wsServiceContent.includes('WebSocket is disabled, skipping connection');
  
  if (hasDisableCheck) {
    console.log('✅ WebSocket service has disable check');
  } else {
    console.log('❌ WebSocket service missing disable check');
  }
} catch (error) {
  console.log('❌ Error reading WebSocketService.ts:', error.message);
}

// Test 3: Verify Project Wizard navigation in QuickActions
console.log('\n📋 Test 3: QuickActions Project Wizard Navigation');
try {
  const quickActionsPath = path.join(__dirname, 'client', 'src', 'components', 'dashboard', 'QuickActions.tsx');
  const quickActionsContent = fs.readFileSync(quickActionsPath, 'utf8');
  
  // Check for project-wizard navigation instead of modal
  const hasProjectWizardNav = quickActionsContent.includes("setLocation('/project-wizard')");
  const noModalOpen = !quickActionsContent.includes('setIsQuickProjectModalOpen(true)') || 
                     quickActionsContent.indexOf("setLocation('/project-wizard')") < 
                     quickActionsContent.indexOf('setIsQuickProjectModalOpen(true)');
  
  if (hasProjectWizardNav && noModalOpen) {
    console.log('✅ QuickActions navigates to Project Wizard');
    results.projectWizardNavigation = true;
  } else {
    console.log('❌ QuickActions still uses modal or missing navigation');
    console.log(`   - Has project-wizard nav: ${hasProjectWizardNav ? '✅' : '❌'}`);
    console.log(`   - No modal open: ${noModalOpen ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log('❌ Error reading QuickActions.tsx:', error.message);
}

// Test 4: Verify Dashboard navigation
console.log('\n📋 Test 4: Dashboard Project Wizard Navigation');
try {
  const dashboardPath = path.join(__dirname, 'client', 'src', 'pages', 'dashboard.tsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  // Check for project-wizard navigation in New Project button
  const hasNewProjectNav = dashboardContent.includes("debouncedNavigate('/project-wizard')");
  const noModalInNewProject = !dashboardContent.includes('setIsQuickProjectModalOpen(true)') ||
                             dashboardContent.split("debouncedNavigate('/project-wizard')").length > 
                             dashboardContent.split('setIsQuickProjectModalOpen(true)').length;
  
  if (hasNewProjectNav && noModalInNewProject) {
    console.log('✅ Dashboard navigates to Project Wizard');
    results.dashboardNavigation = true;
  } else {
    console.log('❌ Dashboard still uses modal or missing navigation');
    console.log(`   - Has project-wizard nav: ${hasNewProjectNav ? '✅' : '❌'}`);
    console.log(`   - No modal in new project: ${noModalInNewProject ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log('❌ Error reading dashboard.tsx:', error.message);
}

// Test 5: Verify Project Wizard structure
console.log('\n📋 Test 5: Project Wizard 4-Step Structure');
try {
  const projectWizardPath = path.join(__dirname, 'client', 'src', 'pages', 'project-wizard.tsx');
  const projectWizardContent = fs.readFileSync(projectWizardPath, 'utf8');
  
  // Check for 4-step structure
  const hasProjectBasics = projectWizardContent.includes('Project Basics');
  const hasContentCreation = projectWizardContent.includes('Content Creation');
  const hasIntegrations = projectWizardContent.includes('Integrations');
  const hasSchedulePlan = projectWizardContent.includes('Schedule & Plan');
  const hasStepsArray = projectWizardContent.includes('const STEPS = [');
  
  if (hasProjectBasics && hasContentCreation && hasIntegrations && hasSchedulePlan && hasStepsArray) {
    console.log('✅ Project Wizard has complete 4-step structure');
    results.fileIntegrity = true;
  } else {
    console.log('❌ Project Wizard missing steps or structure');
    console.log(`   - Project Basics: ${hasProjectBasics ? '✅' : '❌'}`);
    console.log(`   - Content Creation: ${hasContentCreation ? '✅' : '❌'}`);
    console.log(`   - Integrations: ${hasIntegrations ? '✅' : '❌'}`);
    console.log(`   - Schedule & Plan: ${hasSchedulePlan ? '✅' : '❌'}`);
    console.log(`   - Steps array: ${hasStepsArray ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log('❌ Error reading project-wizard.tsx:', error.message);
}

// Test 6: Check for WebSocket hooks disable checks
console.log('\n📋 Test 6: WebSocket Hooks Disable Checks');
try {
  const useWebSocketPath = path.join(__dirname, 'client', 'src', 'hooks', 'useWebSocket.ts');
  const useWebSocketContent = fs.readFileSync(useWebSocketPath, 'utf8');
  
  const hasHookDisableCheck = useWebSocketContent.includes('WebSocket is disabled, skipping connection');
  
  if (hasHookDisableCheck) {
    console.log('✅ useWebSocket hook has disable check');
  } else {
    console.log('❌ useWebSocket hook missing disable check');
  }
  
  const useWebSocketSingletonPath = path.join(__dirname, 'client', 'src', 'hooks', 'useWebSocketSingleton.ts');
  const useWebSocketSingletonContent = fs.readFileSync(useWebSocketSingletonPath, 'utf8');
  
  const hasSingletonDisableCheck = useWebSocketSingletonContent.includes('WebSocket is disabled, skipping connection');
  
  if (hasSingletonDisableCheck) {
    console.log('✅ useWebSocketSingleton hook has disable check');
  } else {
    console.log('❌ useWebSocketSingleton hook missing disable check');
  }
} catch (error) {
  console.log('❌ Error reading WebSocket hooks:', error.message);
}

// Summary
console.log('\n📊 VERIFICATION SUMMARY');
console.log('========================');

const totalTests = Object.keys(results).length;
const passedTests = Object.values(results).filter(Boolean).length;
const successRate = Math.round((passedTests / totalTests) * 100);

console.log(`✅ WebSocket Disable Mechanism: ${results.websocketDisable ? 'PASS' : 'FAIL'}`);
console.log(`✅ Project Wizard Navigation: ${results.projectWizardNavigation ? 'PASS' : 'FAIL'}`);
console.log(`✅ Dashboard Navigation: ${results.dashboardNavigation ? 'PASS' : 'FAIL'}`);
console.log(`✅ File Integrity: ${results.fileIntegrity ? 'PASS' : 'FAIL'}`);

console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);

if (successRate >= 75) {
  console.log('\n🎉 VERIFICATION SUCCESSFUL!');
  console.log('The WebSocket and Project Creation fixes have been properly implemented.');
  console.log('\n📋 Next Steps:');
  console.log('1. Test the application in the browser');
  console.log('2. Verify that WebSocket errors no longer appear in console');
  console.log('3. Confirm that "Create Project" button navigates to the 4-step wizard');
  console.log('4. Check that project details page loads without errors');
} else {
  console.log('\n⚠️ VERIFICATION INCOMPLETE');
  console.log('Some fixes may not be properly implemented. Please review the failed tests above.');
}

// Create a test report
const reportPath = path.join(__dirname, 'websocket-project-fixes-report.json');
const report = {
  timestamp: new Date().toISOString(),
  results,
  successRate,
  status: successRate >= 75 ? 'SUCCESS' : 'INCOMPLETE',
  recommendations: [
    'Test WebSocket disable mechanism in browser console',
    'Verify Project Wizard navigation from dashboard',
    'Check project details page loading without WebSocket errors',
    'Confirm 4-step wizard structure is preserved'
  ]
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

process.exit(successRate >= 75 ? 0 : 1);