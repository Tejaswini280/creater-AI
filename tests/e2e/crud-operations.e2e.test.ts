import { test, expect, Page } from '@playwright/test';

test.describe('CRUD Operations E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to the app
    await page.goto('http://localhost:5000');

    // Login first
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-content"]');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Project CRUD', () => {
    test('should create, read, update, and delete a project', async () => {
      const projectName = `Test Project ${Date.now()}`;

      // Navigate to new project page
      await page.click('[data-testid="create-project-button"]');
      await page.waitForSelector('[data-testid="project-form"]');

      // Fill project form
      await page.fill('[data-testid="project-name-input"]', projectName);
      await page.fill('[data-testid="project-description-input"]', 'E2E test project');
      await page.selectOption('[data-testid="project-type-select"]', 'video');
      await page.selectOption('[data-testid="project-platform-select"]', 'youtube');

      // Submit form
      await page.click('[data-testid="submit-project-button"]');

      // Wait for success and redirect to dashboard
      await page.waitForSelector('[data-testid="dashboard-content"]');

      // Verify project appears in list
      await expect(page.locator(`[data-testid="project-card"]`).filter({ hasText: projectName })).toBeVisible();

      // Click on project to edit
      await page.click(`[data-testid="project-card"]`).filter({ hasText: projectName }).first();
      await page.waitForSelector('[data-testid="project-edit-form"]');

      // Update project
      const updatedName = `${projectName} - Updated`;
      await page.fill('[data-testid="project-name-input"]', updatedName);
      await page.click('[data-testid="update-project-button"]');

      // Verify update
      await expect(page.locator(`[data-testid="project-card"]`).filter({ hasText: updatedName })).toBeVisible();

      // Delete project
      await page.click(`[data-testid="project-delete-button"]`).filter({ hasText: updatedName }).first();
      await page.click('[data-testid="confirm-delete-button"]');

      // Verify deletion
      await expect(page.locator(`[data-testid="project-card"]`).filter({ hasText: updatedName })).not.toBeVisible();
    });
  });

  test.describe('Content CRUD', () => {
    test('should create, read, update, and delete content', async () => {
      const contentTitle = `Test Content ${Date.now()}`;

      // Navigate to content studio
      await page.click('[data-testid="content-studio-nav"]');
      await page.waitForSelector('[data-testid="content-studio-page"]');

      // Click create content button
      await page.click('[data-testid="create-content-button"]');
      await page.waitForSelector('[data-testid="content-form"]');

      // Fill content form
      await page.fill('[data-testid="content-title-input"]', contentTitle);
      await page.fill('[data-testid="content-description-input"]', 'E2E test content');
      await page.selectOption('[data-testid="content-platform-select"]', 'youtube');
      await page.selectOption('[data-testid="content-type-select"]', 'video');
      await page.fill('[data-testid="content-script-input"]', 'Test script content');

      // Submit form
      await page.click('[data-testid="submit-content-button"]');

      // Wait for success
      await page.waitForSelector('[data-testid="content-list"]');

      // Verify content appears in list
      await expect(page.locator(`[data-testid="content-item"]`).filter({ hasText: contentTitle })).toBeVisible();

      // Click on content to edit
      await page.click(`[data-testid="content-item"]`).filter({ hasText: contentTitle }).first();
      await page.waitForSelector('[data-testid="content-edit-form"]');

      // Update content
      const updatedTitle = `${contentTitle} - Updated`;
      await page.fill('[data-testid="content-title-input"]', updatedTitle);
      await page.click('[data-testid="update-content-button"]');

      // Verify update
      await expect(page.locator(`[data-testid="content-item"]`).filter({ hasText: updatedTitle })).toBeVisible();

      // Delete content
      await page.click(`[data-testid="content-delete-button"]`).filter({ hasText: updatedTitle }).first();
      await page.click('[data-testid="confirm-delete-button"]');

      // Verify deletion
      await expect(page.locator(`[data-testid="content-item"]`).filter({ hasText: updatedTitle })).not.toBeVisible();
    });
  });

  test.describe('Social Media Integration', () => {
    test('should connect and disconnect social accounts', async () => {
      // Navigate to social accounts page
      await page.click('[data-testid="social-accounts-nav"]');
      await page.waitForSelector('[data-testid="social-accounts-page"]');

      // Click connect YouTube button
      await page.click('[data-testid="connect-youtube-button"]');

      // Mock OAuth flow (in real test, this would handle the OAuth popup)
      // For now, verify the connection attempt
      await page.waitForSelector('[data-testid="oauth-loading"]');

      // Verify account appears after connection
      await expect(page.locator('[data-testid="social-account-item"]').filter({ hasText: 'YouTube' })).toBeVisible();

      // Disconnect account
      await page.click('[data-testid="disconnect-account-button"]');
      await page.click('[data-testid="confirm-disconnect-button"]');

      // Verify disconnection
      await expect(page.locator('[data-testid="social-account-item"]').filter({ hasText: 'YouTube' })).not.toBeVisible();
    });
  });

  test.describe('Scheduler Operations', () => {
    test('should schedule and manage content', async () => {
      // Navigate to scheduler
      await page.click('[data-testid="scheduler-nav"]');
      await page.waitForSelector('[data-testid="scheduler-page"]');

      // Create content to schedule
      const contentTitle = `Schedulable Content ${Date.now()}`;
      await page.click('[data-testid="create-content-button"]');
      await page.waitForSelector('[data-testid="content-form"]');

      await page.fill('[data-testid="content-title-input"]', contentTitle);
      await page.selectOption('[data-testid="content-platform-select"]', 'youtube');
      await page.selectOption('[data-testid="content-type-select"]', 'video');
      await page.click('[data-testid="submit-content-button"]');

      // Schedule the content
      await page.click(`[data-testid="schedule-content-button"]`).filter({ hasText: contentTitle }).first();
      await page.waitForSelector('[data-testid="schedule-modal"]');

      // Set schedule date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('[data-testid="schedule-date-input"]', tomorrow.toISOString().split('T')[0]);
      await page.fill('[data-testid="schedule-time-input"]', '10:00');
      await page.selectOption('[data-testid="schedule-recurrence-select"]', 'none');
      await page.selectOption('[data-testid="schedule-timezone-select"]', 'America/New_York');

      // Submit schedule
      await page.click('[data-testid="submit-schedule-button"]');

      // Verify content appears in scheduled list
      await expect(page.locator(`[data-testid="scheduled-content-item"]`).filter({ hasText: contentTitle })).toBeVisible();

      // Test bulk operations
      await page.check(`[data-testid="content-checkbox"]`).filter({ hasText: contentTitle }).first();
      await page.click('[data-testid="bulk-actions-button"]');
      await page.click('[data-testid="bulk-reschedule-button"]');

      // Update schedule
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      await page.fill('[data-testid="bulk-schedule-date-input"]', nextWeek.toISOString().split('T')[0]);
      await page.click('[data-testid="bulk-update-schedule-button"]');

      // Verify reschedule
      await expect(page.locator(`[data-testid="scheduled-content-item"]`).filter({ hasText: nextWeek.toISOString().split('T')[0] })).toBeVisible();
    });
  });

  test.describe('AI Features', () => {
    test('should generate and manage AI content', async () => {
      // Navigate to AI generator
      await page.click('[data-testid="ai-generator-nav"]');
      await page.waitForSelector('[data-testid="ai-generator-page"]');

      // Test script generation
      await page.click('[data-testid="script-generator-tab"]');
      await page.fill('[data-testid="script-topic-input"]', 'How to create engaging YouTube videos');
      await page.selectOption('[data-testid="script-platform-select"]', 'youtube');
      await page.selectOption('[data-testid="script-style-select"]', 'educational');
      await page.click('[data-testid="generate-script-button"]');

      // Wait for generation
      await page.waitForSelector('[data-testid="script-result"]');

      // Verify result
      await expect(page.locator('[data-testid="generated-script"]')).toBeVisible();

      // Test video generation
      await page.click('[data-testid="video-generator-tab"]');
      await page.fill('[data-testid="video-prompt-input"]', 'Create a video about productivity tips');
      await page.selectOption('[data-testid="video-style-select"]', 'modern');
      await page.click('[data-testid="generate-video-button"]');

      // Wait for generation
      await page.waitForSelector('[data-testid="video-result"]');

      // Verify result
      await expect(page.locator('[data-testid="generated-video"]')).toBeVisible();

      // Test history cleanup
      await page.click('[data-testid="ai-history-tab"]');
      await page.click('[data-testid="cleanup-old-tasks-button"]');
      await page.click('[data-testid="confirm-cleanup-button"]');

      // Verify cleanup success
      await expect(page.locator('[data-testid="cleanup-success-message"]')).toBeVisible();
    });
  });

  test.describe('Analytics and Reporting', () => {
    test('should view and export analytics', async () => {
      // Navigate to analytics
      await page.click('[data-testid="analytics-nav"]');
      await page.waitForSelector('[data-testid="analytics-page"]');

      // Wait for data to load
      await page.waitForSelector('[data-testid="analytics-chart"]');

      // Verify charts are visible
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible();

      // Test export functionality
      await page.click('[data-testid="export-analytics-button"]');
      await page.selectOption('[data-testid="export-format-select"]', 'csv');
      await page.click('[data-testid="download-export-button"]');

      // Verify download starts (check for download event or success message)
      await expect(page.locator('[data-testid="export-success-message"]')).toBeVisible();

      // Test date range filtering
      await page.fill('[data-testid="analytics-start-date"]', '2024-01-01');
      await page.fill('[data-testid="analytics-end-date"]', '2024-12-31');
      await page.click('[data-testid="apply-date-filter-button"]');

      // Verify data updates
      await page.waitForSelector('[data-testid="analytics-updated"]');
      await expect(page.locator('[data-testid="analytics-updated"]')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate forms and show error messages', async () => {
      // Test project form validation
      await page.click('[data-testid="create-project-button"]');
      await page.waitForSelector('[data-testid="project-form"]');

      // Try to submit empty form
      await page.click('[data-testid="submit-project-button"]');

      // Verify validation errors
      await expect(page.locator('[data-testid="project-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-name-error"]')).toContainText('required');

      // Fill invalid data
      await page.fill('[data-testid="project-name-input"]', 'A'); // Too short
      await page.click('[data-testid="submit-project-button"]');

      // Verify field-level validation
      await expect(page.locator('[data-testid="project-name-error"]')).toContainText('at least 3 characters');
    });

    test('should validate scheduling constraints', async () => {
      // Create content for scheduling
      await page.click('[data-testid="create-content-button"]');
      await page.fill('[data-testid="content-title-input"]', 'Schedule Test Content');
      await page.selectOption('[data-testid="content-platform-select"]', 'youtube');
      await page.selectOption('[data-testid="content-type-select"]', 'video');
      await page.click('[data-testid="submit-content-button"]');

      // Try to schedule in the past
      await page.click('[data-testid="schedule-content-button"]');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await page.fill('[data-testid="schedule-date-input"]', yesterday.toISOString().split('T')[0]);
      await page.click('[data-testid="submit-schedule-button"]');

      // Verify validation error
      await expect(page.locator('[data-testid="schedule-error"]')).toContainText('future');
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async () => {
      // Test keyboard navigation through main navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="nav-item"]:focus')).toBeVisible();

      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Test form keyboard navigation
      await page.click('[data-testid="create-project-button"]');
      await page.keyboard.press('Tab'); // Focus first input
      await page.keyboard.type('Test Project');
      await page.keyboard.press('Tab'); // Next field
      await page.keyboard.type('Test description');

      // Test keyboard form submission
      await page.keyboard.press('Enter'); // Submit button should be focused
      await expect(page.locator('[data-testid="project-form"]')).not.toBeVisible();
    });

    test('should have proper ARIA labels', async () => {
      // Check critical interactive elements have ARIA labels
      await expect(page.locator('[aria-label="Create project"]')).toBeVisible();
      await expect(page.locator('[aria-label="Save content"]')).toBeVisible();
      await expect(page.locator('[aria-label="Delete item"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());

      await page.click('[data-testid="create-project-button"]');
      await page.fill('[data-testid="project-name-input"]', 'Network Test Project');
      await page.click('[data-testid="submit-project-button"]');

      // Verify error message
      await expect(page.locator('[data-testid="network-error-message"]')).toBeVisible();

      // Test retry functionality
      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('[data-testid="network-error-message"]')).toBeVisible();
    });

    test('should handle authentication errors', async () => {
      // Simulate auth expiration
      await page.evaluate(() => {
        localStorage.removeItem('authToken');
      });

      await page.reload();

      // Should redirect to login
      await page.waitForSelector('[data-testid="login-form"]');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });
});
