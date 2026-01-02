import { test, expect } from '@playwright/test';

test.describe('Debug Content API', () => {
  test('debug content creation API', async ({ page, request }) => {
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
      
      // Test 4: Check current content count
      const initialListRes = await request.get('/api/content?limit=50', { 
        headers: { Authorization: `Bearer ${loginJson.accessToken}` } 
      });
      console.log('Initial content list API status:', initialListRes.status());
      
      if (initialListRes.ok()) {
        const initialListJson = await initialListRes.json();
        const initialContentArr = Array.isArray(initialListJson) ? initialListJson : (initialListJson.content || []);
        console.log('Initial content array length:', initialContentArr.length);
      }
      
      // Test 5: Try to create content directly via API
      const uniqueTitle = `Debug API Content ${unique}`;
      const contentData = {
        title: uniqueTitle,
        description: 'Debug test content created via API',
        platform: 'youtube',
        contentType: 'video',
        status: 'draft',
        tags: ['debug', 'test']
      };
      
      console.log('Creating content via API:', contentData);
      const createRes = await request.post('/api/content/create', {
        data: contentData,
        headers: { 
          Authorization: `Bearer ${loginJson.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Content creation API status:', createRes.status());
      if (createRes.ok()) {
        const createJson = await createRes.json();
        console.log('Content creation response:', createJson);
      } else {
        const errorText = await createRes.text();
        console.log('Content creation error:', errorText);
      }
      
      // Test 6: Check content count after creation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const finalListRes = await request.get('/api/content?limit=50', { 
        headers: { Authorization: `Bearer ${loginJson.accessToken}` } 
      });
      console.log('Final content list API status:', finalListRes.status());
      
      if (finalListRes.ok()) {
        const finalListJson = await finalListRes.json();
        const finalContentArr = Array.isArray(finalListJson) ? finalListJson : (finalListJson.content || []);
        console.log('Final content array length:', finalContentArr.length);
        
        if (finalContentArr.length > 0) {
          const created = finalContentArr.find((c: any) => (c.title || '').includes(uniqueTitle));
          if (created) {
            console.log('Content found after creation:', created.title);
          } else {
            console.log('Content not found with title:', uniqueTitle);
            console.log('All content titles:', finalContentArr.map((c: any) => c.title));
          }
        }
      }
      
      // Test 7: Try alternative content creation endpoint
      console.log('Trying alternative content creation endpoint...');
      const altCreateRes = await request.post('/api/content', {
        data: {
          title: `Alt Debug Content ${unique}`,
          description: 'Alternative debug test content',
          platform: 'instagram',
          contentType: 'image',
          status: 'draft'
        },
        headers: { 
          Authorization: `Bearer ${loginJson.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Alternative content creation status:', altCreateRes.status());
      if (altCreateRes.ok()) {
        const altCreateJson = await altCreateRes.json();
        console.log('Alternative content creation response:', altCreateJson);
      } else {
        const altErrorText = await altCreateRes.text();
        console.log('Alternative content creation error:', altErrorText);
      }
      
    } else {
      console.log('Login failed, status:', loginRes.status());
      const errorText = await loginRes.text();
      console.log('Login error:', errorText);
    }
  });
});
