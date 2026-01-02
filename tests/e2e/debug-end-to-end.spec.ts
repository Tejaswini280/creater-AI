import { test, expect } from '@playwright/test';

test.describe('Debug End-to-End Test', () => {
  test('debug page loading and authentication', async ({ page, request }) => {
    // Test 1: Check if server is accessible
    const healthRes = await request.get('/api/health');
    console.log('Health check status:', healthRes.status());
    expect(healthRes.ok()).toBeTruthy();

    // Test 2: Try to register a user
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const email = `debug${unique}@example.com`;
    const password = 'password123';
    
    console.log('Attempting to register user:', email);
    const registerRes = await request.post('/api/auth/register', { 
      data: { email, password, firstName: 'Debug', lastName: 'User' } 
    });
    console.log('Register status:', registerRes.status());
    
    // Test 3: Try to login
    console.log('Attempting to login user:', email);
    const loginRes = await request.post('/api/auth/login', { 
      data: { email, password }, 
      headers: { 'Content-Type': 'application/json' } 
    });
    console.log('Login status:', loginRes.status());
    
    if (loginRes.ok()) {
      const loginJson = await loginRes.json();
      console.log('Login successful, token:', loginJson.accessToken ? 'present' : 'missing');
      
      // Test 4: Set authentication and navigate to recent content page
      await page.addInitScript(([token, userStr]) => {
        localStorage.setItem('token', token as string);
        localStorage.setItem('user', userStr as string);
        console.log('Set localStorage token and user');
      }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);
      
      // Test 5: Navigate to the page
      console.log('Navigating to /content/recent');
      await page.goto('/content/recent');
      
      // Test 6: Check URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/content/recent');
      
      // Test 7: Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Test 8: Check page content
      const pageContent = await page.content();
      console.log('Page content length:', pageContent.length);
      console.log('Page title:', await page.title());
      
      // Test 9: Look for specific elements
      const h1Elements = await page.locator('h1').all();
      console.log('H1 elements found:', h1Elements.length);
      for (let i = 0; i < h1Elements.length; i++) {
        const text = await h1Elements[i].textContent();
        console.log(`H1 ${i}:`, text);
      }
      
      // Test 10: Look for "Recent Content" text anywhere on the page
      const recentContentText = await page.locator('text=Recent Content').isVisible();
      console.log('Recent Content text visible:', recentContentText);
      
      // Test 11: Take a screenshot for debugging
      await page.screenshot({ path: 'debug-page.png', fullPage: true });
      
      // Test 12: Check if there are any console errors
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      });
      
      // Wait a bit more to capture console logs
      await page.waitForTimeout(2000);
      
      console.log('Console logs:', consoleLogs);
      
    } else {
      console.log('Login failed, status:', loginRes.status());
      const errorText = await loginRes.text();
      console.log('Login error:', errorText);
    }
  });
});
