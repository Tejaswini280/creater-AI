import { test, expect } from '@playwright/test';

test.describe('Debug Webkit', () => {
  test('debug webkit page rendering', async ({ page, request }) => {
    // Test 1: Check if server is accessible
    const healthRes = await request.get('/api/health');
    console.log('Health check status:', healthRes.status());
    expect(healthRes.ok()).toBeTruthy();

    // Test 2: Register a user
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const email = `webkit${unique}@example.com`;
    const password = 'password123';
    
    console.log('Attempting to register user:', email);
    const registerRes = await request.post('/api/auth/register', { 
      data: { email, password, firstName: 'Webkit', lastName: 'User' } 
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

    // Test 4: Set authentication in browser
    await page.addInitScript(([token, userStr]) => {
      localStorage.setItem('token', token as string);
      localStorage.setItem('user', userStr as string);
      console.log('Set localStorage token and user');
    }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);

    // Test 5: Navigate to the page
    console.log('Navigating to /content/recent');
    await page.goto('/content/recent');
    
    // Test 6: Check URL and wait for load
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Wait for page to load with longer timeout
    console.log('Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    console.log('Page loaded, waiting for content...');
    
    // Test 7: Check page title
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Test 8: Check if we're redirected
    if (currentUrl !== page.url()) {
      console.log('Page was redirected from', currentUrl, 'to', page.url());
    }
    
    // Test 9: Wait a bit more for any dynamic content
    console.log('Waiting additional time for dynamic content...');
    await page.waitForTimeout(3000);
    
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
    
    // Test 12: Look for any text containing "Content" (pick first match to avoid strict mode)
    const contentText = await page.locator('text=Content').first().isVisible().catch(() => false);
    console.log('Text containing "Content" visible:', contentText);
    
    // Test 13: Check page content
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    
    // Test 14: Look for any heading elements (h1, h2, h3)
    const allHeadings = await page.locator('h1, h2, h3').all();
    console.log('All heading elements found:', allHeadings.length);
    for (let i = 0; i < allHeadings.length; i++) {
      const tagName = await allHeadings[i].evaluate(el => el.tagName.toLowerCase());
      const text = await allHeadings[i].textContent();
      console.log(`${tagName} ${i}:`, text);
    }
    
    // Test 15: Look for any div elements with text
    const divsWithText = await page.locator('div:has-text("Recent"), div:has-text("Content")').all();
    console.log('Divs with Recent/Content text found:', divsWithText.length);
    for (let i = 0; i < divsWithText.length; i++) {
      const text = await divsWithText[i].textContent();
      console.log(`Div ${i}:`, text?.substring(0, 100));
    }
    
    // Test 16: Take a screenshot
    await page.screenshot({ path: 'debug-webkit.png', fullPage: true });
    
    // Test 17: Check console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait a bit more to capture console logs
    await page.waitForTimeout(2000);
    console.log('Console logs:', consoleLogs);
    
    // Test 18: Check localStorage in browser
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('token'));
    const userInStorage = await page.evaluate(() => localStorage.getItem('user'));
    console.log('Token in localStorage:', tokenInStorage ? `present (${tokenInStorage.length} chars)` : 'missing');
    console.log('User in localStorage:', userInStorage ? 'present' : 'missing');
    
    // Test 19: Try to find the element with a different approach
    console.log('Trying alternative locators...');
    
    // Try by text content
    const byText = page.locator('text=Recent Content');
    const byTextCount = await byText.count();
    console.log('Elements with text "Recent Content":', byTextCount);
    
    // Try by partial text
    const byPartialText = page.locator('text=Recent');
    const byPartialTextCount = await byPartialText.count();
    console.log('Elements with text "Recent":', byPartialTextCount);
    
    // Try by role and name
    const byRole = page.locator('h1:has-text("Recent Content")');
    const byRoleCount = await byRole.count();
    console.log('H1 elements with text "Recent Content":', byRoleCount);
    
    // Try by CSS selector
    const byCSS = page.locator('h1');
    const byCSSCount = await byCSS.count();
    console.log('All H1 elements:', byCSSCount);
    
    if (byCSSCount > 0) {
      for (let i = 0; i < byCSSCount; i++) {
        const h1 = byCSS.nth(i);
        const text = await h1.textContent();
        const isVisible = await h1.isVisible();
        console.log(`H1 ${i}: text="${text}", visible=${isVisible}`);
      }
    }
  });
});
