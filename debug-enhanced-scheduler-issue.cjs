const fs = require('fs');
const path = require('path');

console.log('🔍 Enhanced Scheduler Calendar Issue Diagnostic');
console.log('==============================================');

// Check if enhanced scheduler file exists and is properly formatted
const enhancedSchedulerPath = './client/src/pages/enhanced-scheduler.tsx';
const regularSchedulerPath = './client/src/pages/scheduler.tsx';

try {
  console.log('\n📁 File System Check:');
  
  // Check enhanced scheduler
  if (fs.existsSync(enhancedSchedulerPath)) {
    const enhancedContent = fs.readFileSync(enhancedSchedulerPath, 'utf8');
    console.log('✅ Enhanced scheduler file exists');
    console.log(`📊 Size: ${enhancedContent.length} characters`);
    
    // Check for key identifiers
    if (enhancedContent.includes('Smart Content Scheduler Pro')) {
      console.log('✅ Contains "Smart Content Scheduler Pro" title');
    } else {
      console.log('❌ Missing "Smart Content Scheduler Pro" title');
    }
    
    if (enhancedContent.includes('enhanced-scheduler-page')) {
      console.log('✅ Contains unique CSS class identifier');
    } else {
      console.log('❌ Missing unique CSS class identifier');
    }
    
    if (enhancedContent.includes('export default')) {
      console.log('✅ Has default export');
    } else {
      console.log('❌ Missing default export');
    }
  } else {
    console.log('❌ Enhanced scheduler file not found');
  }
  
  // Check regular scheduler
  if (fs.existsSync(regularSchedulerPath)) {
    const regularContent = fs.readFileSync(regularSchedulerPath, 'utf8');
    console.log('✅ Regular scheduler file exists');
    console.log(`📊 Size: ${regularContent.length} characters`);
    
    if (regularContent.includes('Content Scheduler')) {
      console.log('✅ Regular scheduler has correct title');
    }
  } else {
    console.log('❌ Regular scheduler file not found');
  }
  
  console.log('\n🔧 Potential Issues & Solutions:');
  
  // Check App.tsx routing
  const appPath = './client/src/App.tsx';
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    if (appContent.includes('enhanced-scheduler') && appContent.includes('EnhancedScheduler')) {
      console.log('✅ Routing is properly configured in App.tsx');
    } else {
      console.log('❌ Routing issue in App.tsx');
    }
  }
  
  console.log('\n🎯 Recommended Actions:');
  console.log('1. Clear browser cache and hard refresh (Ctrl+Shift+R)');
  console.log('2. Ensure you are accessing /enhanced-scheduler not /scheduler');
  console.log('3. Check browser developer tools for any JavaScript errors');
  console.log('4. Verify the build completed successfully');
  console.log('5. Check if there are any CSS conflicts');
  
  console.log('\n📋 Quick Test URLs:');
  console.log('Regular Scheduler: http://localhost:5000/scheduler');
  console.log('Enhanced Scheduler: http://localhost:5000/enhanced-scheduler');
  
  console.log('\n🔍 Differences to Look For:');
  console.log('Regular Scheduler: Shows "Content Scheduler" title');
  console.log('Enhanced Scheduler: Shows "Smart Content Scheduler Pro" title');
  console.log('Enhanced Scheduler: Has gradient background and professional styling');
  console.log('Enhanced Scheduler: Has advanced features like bulk operations, templates, etc.');
  
} catch (error) {
  console.error('❌ Error during diagnostic:', error.message);
}

console.log('\n✅ Diagnostic Complete');
console.log('If the issue persists, please check the browser URL and ensure you are accessing /enhanced-scheduler');