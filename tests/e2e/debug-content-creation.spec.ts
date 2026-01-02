import { test, expect } from '@playwright/test';

test.describe('Debug Content Creation', () => {
  test('debug content creation flow', async ({ page, request }) => {
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
      
      // Test 4: Set authentication and navigate to content studio
      await page.addInitScript(([token, userStr]) => {
        localStorage.setItem('token', token as string);
        localStorage.setItem('user', userStr as string);
        console.log('Set localStorage token and user');
      }, [loginJson.accessToken, JSON.stringify(loginJson.user)]);
      
      // Test 5: Navigate to content studio
      console.log('Navigating to /content-studio');
      await page.goto('/content-studio');
      
      // Test 6: Check URL
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      expect(currentUrl).toContain('/content-studio');
      
      // Test 7: Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Test 8: Check page content
      const pageContent = await page.content();
      console.log('Page content length:', pageContent.length);
      console.log('Page title:', await page.title());
      
      // Test 9: Look for create content button
      const createBtns = page.getByRole('button', { name: /create content|new content|add content/i });
      const createBtnCount = await createBtns.count();
      console.log('Create content buttons found:', createBtnCount);
      
      if (createBtnCount > 0) {
        // Use the first button
        const createBtn = createBtns.first();
        const createBtnVisible = await createBtn.isVisible();
        console.log('First create content button visible:', createBtnVisible);
        console.log('First create content button text:', await createBtn.textContent());
        
        if (createBtnVisible) {
          // Test 10: Click the create content button
          console.log('Clicking create content button');
          await createBtn.click();
          
          // Test 11: Wait for modal to appear
          await page.waitForTimeout(1000);
          
          // Test 12: Look for form fields
          const titleField = page.getByLabel(/title/i);
          const titleFieldVisible = await titleField.isVisible();
          console.log('Title field visible:', titleFieldVisible);
          
          if (titleFieldVisible) {
            // Test 13: Fill in the form
            const uniqueTitle = `Debug Content ${unique}`;
            console.log('Filling title:', uniqueTitle);
            await titleField.fill(uniqueTitle);
            
            const desc = page.getByLabel(/description/i);
            if (await desc.isVisible()) {
              console.log('Filling description');
              await desc.fill('Debug test content');
            }
            
            // Test 14: Submit the form
            const submit = page.getByRole('button', { name: /create/i });
            if (await submit.isVisible()) {
              console.log('Submitting form');
              await submit.click();
              
              // Test 15: Wait for submission
              await page.waitForTimeout(2000);
              
              // Test 16: Check if content was created via API
              const listRes = await request.get('/api/content?limit=50', { 
                headers: { Authorization: `Bearer ${loginJson.accessToken}` } 
              });
              console.log('Content list API status:', listRes.status());
              
              if (listRes.ok()) {
                const listJson = await listRes.json();
                const contentArr = Array.isArray(listJson) ? listJson : (listJson.content || []);
                console.log('Content array length:', contentArr.length);
                
                if (contentArr.length > 0) {
                  const created = contentArr.find((c: any) => (c.title || '').includes(uniqueTitle));
                  if (created) {
                    console.log('Content created successfully:', created.title);
                  } else {
                    console.log('Content not found with title:', uniqueTitle);
                  }
                }
              }
            } else {
              console.log('Submit button not visible');
            }
          } else {
            console.log('Title field not visible');
          }
        } else {
          console.log('Create content button not visible');
        }
      } else {
        console.log('Create content button not found');
        
        // Test alternative: Look for any buttons on the page
        const allButtons = await page.locator('button').all();
        console.log('All buttons found:', allButtons.length);
        for (let i = 0; i < allButtons.length; i++) {
          const text = await allButtons[i].textContent();
          console.log(`Button ${i}:`, text);
        }
      }
      
      // Test 17: Take a screenshot for debugging
      await page.screenshot({ path: 'debug-content-studio.png', fullPage: true });
      
    } else {
      console.log('Login failed, status:', loginRes.status());
      const errorText = await loginRes.text();
      console.log('Login error:', errorText);
    }
  });
});
