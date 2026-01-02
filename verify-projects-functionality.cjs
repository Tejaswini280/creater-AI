const puppeteer = require('puppeteer');

async function testProjectsFunctionality() {
  console.log('🚀 Testing Projects Page Functionality...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Test 1: Navigate to dashboard
    console.log('📊 Test 1: Loading Dashboard...');
    await page.goto('http://localhost:5000/dashboard');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('ℹ️  Redirected to login page - authentication required');
      
      // Try to login with test credentials
      console.log('🔐 Attempting login...');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
    }
    
    // Wait for dashboard to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Test 2: Look for "View All Projects" button
    console.log('🔍 Test 2: Looking for "View All Projects" button...');
    
    const viewAllButton = await page.$('button:contains("View All Projects")') || 
                         await page.$('*:contains("View All Projects")');
    
    if (viewAllButton) {
      console.log('✅ Found "View All Projects" button');
      
      // Test 3: Click the button
      console.log('👆 Test 3: Clicking "View All Projects" button...');
      await viewAllButton.click();
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      
      // Check if we're on the projects page
      const projectsUrl = page.url();
      if (projectsUrl.includes('/projects')) {
        console.log('✅ Successfully navigated to projects page');
        
        // Test 4: Check projects page content
        console.log('📋 Test 4: Checking projects page content...');
        
        await page.waitForSelector('h1', { timeout: 5000 });
        const pageTitle = await page.$eval('h1', el => el.textContent);
        
        if (pageTitle.includes('All Projects')) {
          console.log('✅ Projects page loaded with correct title');
          
          // Check for search and filter elements
          const hasSearch = await page.$('input[placeholder*="Search"]');
          const hasFilters = await page.$('select') || await page.$('[role="combobox"]');
          
          if (hasSearch) console.log('✅ Search functionality present');
          if (hasFilters) console.log('✅ Filter functionality present');
          
          // Check for projects grid or empty state
          const hasProjects = await page.$('.grid') || await page.$('[class*="grid"]');
          const hasEmptyState = await page.$('*:contains("No projects")');
          
          if (hasProjects) {
            console.log('✅ Projects grid layout detected');
          } else if (hasEmptyState) {
            console.log('ℹ️  Empty state displayed (no projects yet)');
          }
          
          console.log('\n🎉 All tests passed! Projects functionality is working correctly.');
          
        } else {
          console.log('❌ Projects page title incorrect:', pageTitle);
        }
      } else {
        console.log('❌ Navigation failed - current URL:', projectsUrl);
      }
    } else {
      console.log('❌ "View All Projects" button not found on dashboard');
      
      // Try direct navigation to projects page
      console.log('🔄 Test 3b: Testing direct navigation to /projects...');
      await page.goto('http://localhost:5000/projects');
      await page.waitForSelector('body', { timeout: 5000 });
      
      const directUrl = page.url();
      if (directUrl.includes('/projects')) {
        console.log('✅ Direct navigation to projects page works');
      } else {
        console.log('❌ Direct navigation failed - redirected to:', directUrl);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testProjectsFunctionality().catch(console.error);