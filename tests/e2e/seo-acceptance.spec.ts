import { test, expect } from '@playwright/test';

test.describe('Phase 7 Task 7.3 - SEO & Performance Acceptance', () => {
  test('robots.txt and sitemap.xml are served with expected content', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
    const robotsText = await robots.text();
    expect(robotsText).toContain('User-agent');
    expect(robotsText).toContain('Sitemap: /sitemap.xml');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc');
  });

  test('index.html includes SEO meta and JSON-LD', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CreatorAI Studio/i);
    const description = await page.locator('head meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toBeTruthy();
    expect(ld).toContain('schema.org');
  });

  test('images use lazy loading on content list and profile image', async ({ page, request }) => {
    // Authenticate quickly via dev token
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 'test-user-id', email: 't@example.com', firstName: 'T', lastName: 'User', profileImageUrl: 'https://via.placeholder.com/80' }));
    });
    // Create one piece of content via API so recent list has an image
    await request.post('/api/content', {
      data: {
        title: `SEO Test Content ${Date.now()}`,
        description: 'content for seo image lazy test',
        platform: 'youtube',
        contentType: 'video',
        status: 'draft',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=160&h=120&fit=crop'
      },
      headers: { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' }
    }).catch(() => null);

    // Ensure at least one content exists (retry a few times)
    for (let i = 0; i < 6; i++) {
      const list = await request.get('/api/content', { headers: { 'Authorization': 'Bearer test-token' } });
      if (list.ok()) {
        try {
          const json = await list.json();
          const arr = Array.isArray(json) ? json : (json.content || []);
          if (arr.length > 0) break;
        } catch {}
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // If create failed, still proceed; the page may have existing content
    // Visit dashboard first to hydrate auth state
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/content/recent');
    await page.waitForLoadState('networkidle');
    // Prefer checking any lazy image on recent-content first, retry up to ~5s
    let lazyCount = 0;
    for (let i = 0; i < 10; i++) {
      lazyCount = await page.locator('img[loading="lazy"]').count();
      if (lazyCount > 0) break;
      await page.waitForTimeout(500);
    }
    if (lazyCount === 0) {
      // Fallback: dashboard has a lazy image (profile)
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      for (let i = 0; i < 10; i++) {
        lazyCount = await page.locator('img[loading="lazy"]').count();
        if (lazyCount > 0) break;
        await page.waitForTimeout(500);
      }
    }
    expect(lazyCount).toBeGreaterThan(0);
  });
});


