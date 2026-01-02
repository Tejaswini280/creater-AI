import { test, expect } from '@playwright/test';

test.describe('Debug Authentication Flow', () => {
  test('debug authentication and page navigation step by step', async ({ page, request }) => {
    // Test 1: Check if server is accessible
    const healthRes = await request.get('/api/health');
    console.log('Health check status:', healthRes.status());
    expect(healthRes.ok()).toBeTruthy();

    // Test 2: Register a user
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const email = `debug${unique}@example.com`;
    const password = 'password123';
    
    console.log('Attempting to register user:', email);
    const registerRes = await request.post('/api/auth/register', { 
      data: { email, password, firstName: 'Debug', lastName: 'User' } 
    });
    console.log('Register status:', registerRes.status());
    
    if (!registerRes.ok()) {
      const errorText = await registerRes.text();
      console.log('Register error:', errorText);
      return;
    }

    // Test 3: Login
    console.log('Attempting to login user:', email);
    const loginRes = await request.post('/api/auth/login', { 
      data: { email, password }, 
      headers: { 'Content-Type': 'application/json' } 
    });
    console.log('Login status:', loginRes.status());
    
    if (!loginRes.ok()) {
      const errorText = await loginRes.text();
      console.log('Login error:', errorText);
      return;
    }

    const loginJson = await loginRes.json();
    console.log('Login successful, token length:', loginJson.accessToken?.length || 0);
    console.log('User data:', JSON.stringify(loginJson.user, null, 2));

    // Test 4: Verify token works with API
    const testApiRes = await request.get('/api/content?limit=1', {
      headers: { Authorization: `Bearer ${loginJson.accessToken}` }
    });
    console.log('Test API call status:', testApiRes.status());
    
    if (testApiRes.ok()) {
      const testApiJson = await testApiRes.json();
      console.log('Test API response:', JSON.stringify(testApiJson, null, 2));
    } else {
      const errorText = await testApiRes.text();
      console.log('Test API error:', errorText);
    }

    // Test 5: Set authentication in browser
    await page.addInitScript(([token, userStr]) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('user', userStr as string);
      console.log('Set localStorage token and user');
      console.log('Token length:', (token as string).length);
      console.log('User data:', userStr);
    }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);

    // Test 6: Navigate to the page
    console.log('Navigating to /content/recent');
    await page.goto('/content/recent');
    
    // Test 7: Check URL and wait for load
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('Page loaded, waiting for content...');
    
    // Test 8: Check page title
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Test 9: Check if we're redirected
    if (currentUrl !== page.url()) {
      console.log('Page was redirected from', currentUrl, 'to', page.url());
    }
    
    // Test 10: Look for any H1 elements
    const h1Elements = await page.locator('h1').all();
    console.log('H1 elements found:', h1Elements.length);
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`H1 ${i}:`, text);
    }
    
    // Test 11: Look for any text containing "Recent"
    const recentText = await page.locator('text=Recent').isVisible();
    console.log('Text containing "Recent" visible:', recentText);
    
    // Test 12: Check page content
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    
    // Test 13: Take a screenshot
    await page.screenshot({ path: 'debug-auth-flow.png', fullPage: true });
    
    // Test 14: Check console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait a bit more to capture console logs
    await page.waitForTimeout(2000);
    console.log('Console logs:', consoleLogs);
    
    // Test 15: Check localStorage in browser
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('token'));
    const userInStorage = await page.evaluate(() => localStorage.getItem('user'));
    console.log('Token in localStorage:', tokenInStorage ? `present (${tokenInStorage.length} chars)` : 'missing');
    console.log('User in localStorage:', userInStorage ? 'present' : 'missing');
  });
});
