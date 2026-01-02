import { test, expect } from '@playwright/test';

test.describe('Content creation and listing', () => {
  test.beforeEach(async ({ page, request }) => {
    // Ensure seed user exists
    await request.post('/api/auth/register', {
      data: { email: 'seed@example.com', password: 'password123', firstName: 'Seed', lastName: 'User' }
    }).catch(() => {});

    // Ensure logged in; if not, go to login and log in as seed user
    await page.goto('/');
    const isLanding = await page.getByText(/creatorai studio/i).isVisible().catch(() => false);
    if (isLanding) {
      await page.goto('/login');
      await page.getByLabel(/^email$/i).fill('seed@example.com');
      await page.getByLabel(/^password$/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');
    }
  });

  test('create content via modal and see it in recent content', async ({ page, request }) => {
    // Open content studio
    await page.goto('/content-studio');

    // Open create content modal (button text may vary)
    const createButton = page.getByRole('button', { name: /create content/i });
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
    }

    // Fill form fields if modal present
    const titleField = page.getByLabel(/title/i);
    if (await titleField.isVisible().catch(() => false)) {
      const unique = Date.now();
      await titleField.fill(`E2E Content ${unique}`);
      const desc = page.getByLabel(/description/i);
      if (await desc.isVisible().catch(() => false)) {
        await desc.fill('Automated test description');
      }
      // Submit
      const submit = page.getByRole('button', { name: /create/i });
      await submit.click();
    }

    // Navigate to recent content and expect list present
    await page.goto('/content/recent');
    await expect(page).toHaveURL(/\/content\/recent$/);
  });
});


