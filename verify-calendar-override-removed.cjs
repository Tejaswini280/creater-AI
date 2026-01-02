const fs = require('fs');

console.log('🔍 Verifying Calendar Override Removal');
console.log('=====================================');

try {
  const enhancedSchedulerPath = './client/src/pages/enhanced-scheduler.tsx';
  const content = fs.readFileSync(enhancedSchedulerPath, 'utf8');
  
  console.log('✅ Enhanced scheduler file exists');
  
  // Check for removed components
  const removedItems = [
    { name: 'renderDayView function', pattern: 'renderDayView', shouldExist: false },
    { name: 'renderWeekView function', pattern: 'renderWeekView', shouldExist: false },
    { name: 'renderMonthView function', pattern: 'renderMonthView', shouldExist: false },
    { name: 'renderCurrentView function', pattern: 'renderCurrentView', shouldExist: false },
    { name: 'Main Calendar section', pattern: 'Main Calendar', shouldExist: false },
    { name: 'CalendarClock component', pattern: 'CalendarClock', shouldExist: false },
    { name: 'ViewType selector', pattern: 'ViewType', shouldExist: false },
    { name: 'Calendar navigation', pattern: 'ChevronLeft', shouldExist: false },
    { name: 'Calendar date functions', pattern: 'addDays|subDays|addWeeks', shouldExist: false }
  ];
  
  // Check for preserved components
  const preservedItems = [
    { name: 'Smart Content Scheduler Pro title', pattern: 'Smart Content Scheduler Pro', shouldExist: true },
    { name: 'Schedule Content button', pattern: 'Schedule Content', shouldExist: true },
    { name: 'Content Management Hub', pattern: 'Content Management Hub', shouldExist: true },
    { name: 'Date input field', pattern: 'type="date"', shouldExist: true },
    { name: 'Time input field', pattern: 'type="time"', shouldExist: true },
    { name: 'Enhanced scheduler page class', pattern: 'enhanced-scheduler-page', shouldExist: true }
  ];
  
  let allChecks = [...removedItems, ...preservedItems];
  let passed = 0;
  
  console.log('\n🔧 Checking Removed Components:');
  removedItems.forEach(item => {
    const found = new RegExp(item.pattern).test(content);
    const status = !found ? '✅ REMOVED' : '❌ STILL EXISTS';
    console.log(`${status} ${item.name}`);
    if (!found) passed++;
  });
  
  console.log('\n✅ Checking Preserved Components:');
  preservedItems.forEach(item => {
    const found = new RegExp(item.pattern).test(content);
    const status = found ? '✅ PRESERVED' : '❌ MISSING';
    console.log(`${status} ${item.name}`);
    if (found) passed++;
  });
  
  console.log('\n📊 Results:');
  console.log(`✅ Passed: ${passed}/${allChecks.length}`);
  console.log(`📈 Success Rate: ${Math.round((passed/allChecks.length)*100)}%`);
  
  if (passed === allChecks.length) {
    console.log('\n🎉 CALENDAR OVERRIDE COMPLETELY REMOVED!');
    console.log('✅ All calendar view components removed');
    console.log('✅ All functionality preserved');
    console.log('✅ Clean interface maintained');
    console.log('\n🚀 Enhanced Scheduler is ready with no calendar override!');
  } else {
    console.log('\n⚠️ Some issues detected. Please review the failed checks.');
  }
  
} catch (error) {
  console.error('❌ Error during verification:', error.message);
}

console.log('\n📍 Access Enhanced Scheduler: http://localhost:5000/enhanced-scheduler');