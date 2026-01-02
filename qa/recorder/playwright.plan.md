# Playwright E2E Test Plan for Recorder Page

## Overview
This document outlines the Playwright-based end-to-end test suite for the recorder page, focusing on critical user flows, cross-browser compatibility, and automated regression testing.

## Test Architecture

### Test Structure
```
tests/
├── recorder/
│   ├── recorder.spec.ts          # Main test suite
│   ├── auth.spec.ts              # Authentication tests
│   ├── recording.spec.ts         # Recording functionality
│   ├── editing.spec.ts           # Video editing tests
│   ├── export.spec.ts            # Export functionality
│   ├── library.spec.ts           # Library management
│   ├── accessibility.spec.ts     # A11y tests
│   └── performance.spec.ts       # Performance tests
├── utils/
│   ├── test-helpers.ts           # Shared test utilities
│   ├── mock-data.ts              # Test data fixtures
│   └── page-objects.ts           # Page object models
└── config/
    ├── playwright.config.ts      # Playwright configuration
    └── test-setup.ts             # Global test setup
```

## Page Object Models

### RecorderPage Class
```typescript
export class RecorderPage {
  readonly page: Page;
  readonly recordTab: Locator;
  readonly previewTab: Locator;
  readonly editTab: Locator;
  readonly exportTab: Locator;
  readonly libraryTab: Locator;

  // Recording options
  readonly cameraOption: Locator;
  readonly screenOption: Locator;
  readonly audioOption: Locator;
  readonly screenCameraOption: Locator;

  // Controls
  readonly recordButton: Locator;
  readonly stopButton: Locator;
  readonly pauseButton: Locator;
  readonly playButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Initialize all locators
  }

  async goto() {
    await this.page.goto('/recorder');
    await this.page.waitForLoadState('networkidle');
  }

  async selectRecordingType(type: 'camera' | 'screen' | 'audio' | 'screen-camera') {
    const optionMap = {
      camera: this.cameraOption,
      screen: this.screenOption,
      audio: this.audioOption,
      'screen-camera': this.screenCameraOption
    };
    await optionMap[type].click();
  }

  async startRecording() {
    await this.recordButton.click();
    // Wait for recording to start
    await this.page.waitForSelector('[data-recording="true"]');
  }

  async stopRecording() {
    await this.stopButton.click();
    // Wait for recording to stop
    await this.page.waitForSelector('[data-recording="false"]');
  }
}
```

## Critical Test Scenarios

### 1. Basic Recording Flow
```typescript
test('complete recording workflow', async ({ page }) => {
  const recorder = new RecorderPage(page);

  // Navigate to recorder
  await recorder.goto();

  // Handle permissions
  await recorder.handlePermissions();

  // Select camera recording
  await recorder.selectRecordingType('camera');

  // Start recording
  await recorder.startRecording();

  // Wait for recording duration
  await page.waitForTimeout(5000);

  // Stop recording
  await recorder.stopRecording();

  // Verify recording appears in preview
  await expect(recorder.previewVideo).toBeVisible();

  // Check recording stats
  await expect(recorder.durationDisplay).toContainText('00:05');
});
```

### 2. Authentication Flow
```typescript
test('unauthenticated access redirects to login', async ({ page }) => {
  // Clear any existing session
  await page.context().clearCookies();

  // Attempt to access recorder
  await page.goto('/recorder');

  // Should redirect to login
  await expect(page).toHaveURL(/\/login/);
});

test('authenticated access loads recorder', async ({ page }) => {
  // Setup authenticated session
  await loginUser(page, testUser);

  // Access recorder
  await page.goto('/recorder');

  // Should load recorder page
  await expect(page).toHaveURL(/\/recorder/);
  await expect(page.locator('h1').filter({ hasText: 'What would you like to record?' })).toBeVisible();
});
```

### 3. Permission Handling
```typescript
test('handles camera permission denial', async ({ page, context }) => {
  const recorder = new RecorderPage(page);

  // Override permission API
  await context.grantPermissions([], { origin: process.env.BASE_URL });

  await recorder.goto();
  await recorder.selectRecordingType('camera');

  // Should show permission error
  await expect(page.locator('.error-message')).toContainText('Camera access denied');
});

test('handles microphone permission denial', async ({ page, context }) => {
  const recorder = new RecorderPage(page);

  // Grant camera but deny microphone
  await context.grantPermissions(['camera'], { origin: process.env.BASE_URL });

  await recorder.goto();
  await recorder.selectRecordingType('audio');

  // Should handle gracefully
  await expect(page.locator('.warning-message')).toBeVisible();
});
```

## Advanced Test Scenarios

### 4. Video Editing Workflow
```typescript
test('video trimming functionality', async ({ page }) => {
  const recorder = new RecorderPage(page);

  // Setup: Create a test recording
  await recorder.createTestRecording();

  // Navigate to edit tab
  await recorder.editTab.click();

  // Set trim points
  await recorder.trimStartInput.fill('1');
  await recorder.trimEndInput.fill('4');

  // Apply trim
  await recorder.applyTrimButton.click();

  // Verify trimmed duration
  await expect(recorder.durationDisplay).toContainText('00:03');

  // Verify video plays correctly
  await recorder.playButton.click();
  await page.waitForTimeout(1000);
  await expect(recorder.currentTimeDisplay).toContainText('00:01');
});
```

### 5. Export Functionality
```typescript
test('export with different formats', async ({ page }) => {
  const recorder = new RecorderPage(page);

  // Create recording
  await recorder.createTestRecording();

  // Navigate to export
  await recorder.exportTab.click();

  // Test different formats
  const formats = ['webm', 'mp4', 'avi'];
  for (const format of formats) {
    await recorder.formatSelect.selectOption(format);
    await recorder.downloadButton.click();

    // Verify download started (mock or check download event)
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toMatch(new RegExp(`.${format}$`));
  }
});
```

### 6. Library Management
```typescript
test('library CRUD operations', async ({ page }) => {
  const recorder = new RecorderPage(page);

  // Create and save recording
  await recorder.createTestRecording();
  await recorder.saveToLibrary();

  // Navigate to library
  await recorder.libraryTab.click();

  // Verify recording appears
  await expect(page.locator('.recording-card')).toHaveCount(1);

  // Test edit functionality
  await page.locator('.edit-button').click();
  await recorder.editTab.waitFor({ state: 'visible' });

  // Test delete functionality
  await page.locator('.delete-button').click();
  await page.locator('.confirm-delete').click();
  await expect(page.locator('.recording-card')).toHaveCount(0);
});
```

## Cross-Browser Testing

### Browser Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'chrome-mobile', use: { ...devices['Pixel 5'] } },
    { name: 'safari-mobile', use: { ...devices['iPhone 12'] } }
  ],
  use: {
    baseURL: process.env.BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  }
});
```

### Browser-Specific Tests
```typescript
test('WebRTC compatibility across browsers', async ({ browserName }) => {
  // Test WebRTC features specific to each browser
  test.skip(browserName === 'webkit', 'WebRTC has limitations in WebKit');

  // Test implementation
});

test('MediaRecorder codec support', async ({ browserName }) => {
  const supportedCodecs = {
    chromium: ['vp9', 'vp8', 'h264'],
    firefox: ['vp8', 'h264'],
    webkit: ['h264']
  };

  // Test codec availability
});
```

## Performance Testing

### Load Testing
```typescript
test('concurrent recording sessions', async ({ page, context }) => {
  // Create multiple pages
  const pages = await Promise.all(
    Array(5).fill(0).map(() => context.newPage())
  );

  // Start recordings on all pages
  await Promise.all(pages.map(async (page) => {
    const recorder = new RecorderPage(page);
    await recorder.goto();
    await recorder.selectRecordingType('camera');
    await recorder.startRecording();
  }));

  // Monitor performance
  const startTime = Date.now();
  await page.waitForTimeout(10000);
  const endTime = Date.now();

  // Verify all recordings completed successfully
  // Check memory usage, CPU usage
});
```

### Memory Leak Testing
```typescript
test('memory leak detection', async ({ page }) => {
  const recorder = new RecorderPage(page);

  // Get initial memory usage
  const initialMemory = await page.evaluate(() => {
    return (performance as any).memory.usedJSHeapSize;
  });

  // Perform multiple recording cycles
  for (let i = 0; i < 10; i++) {
    await recorder.createTestRecording();
    await recorder.deleteRecording();
  }

  // Check memory usage after cycles
  const finalMemory = await page.evaluate(() => {
    return (performance as any).memory.usedJSHeapSize;
  });

  const memoryIncrease = finalMemory - initialMemory;
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
});
```

## Accessibility Testing

### Automated A11y Checks
```typescript
test('accessibility compliance', async ({ page }) => {
  const recorder = new RecorderPage(page);
  await recorder.goto();

  // Run axe accessibility checks
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  // Check for critical violations
  const criticalViolations = accessibilityScanResults.violations.filter(
    violation => violation.impact === 'critical'
  );

  expect(criticalViolations).toHaveLength(0);
});
```

### Keyboard Navigation
```typescript
test('keyboard navigation', async ({ page }) => {
  const recorder = new RecorderPage(page);
  await recorder.goto();

  // Test tab navigation
  await page.keyboard.press('Tab');
  let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedElement).toBe('BUTTON'); // First focusable element

  // Test Enter/Space activation
  await page.keyboard.press('Enter');
  // Verify action triggered

  // Test arrow key navigation
  await page.keyboard.press('ArrowRight');
  // Verify next element focused
});
```

## Visual Regression Testing

### Screenshot Comparisons
```typescript
test('visual regression - recorder interface', async ({ page }) => {
  const recorder = new RecorderPage(page);
  await recorder.goto();

  // Take screenshot
  await expect(page).toHaveScreenshot('recorder-interface.png', {
    fullPage: true,
    threshold: 0.1
  });
});

test('visual regression - recording in progress', async ({ page }) => {
  const recorder = new RecorderPage(page);
  await recorder.goto();
  await recorder.selectRecordingType('camera');
  await recorder.startRecording();

  // Wait for recording UI to stabilize
  await page.waitForTimeout(2000);

  // Take screenshot during recording
  await expect(page).toHaveScreenshot('recording-active.png');
});
```

## API Mocking & Integration Testing

### API Response Mocking
```typescript
test('API failure handling', async ({ page }) => {
  // Mock API failures
  await page.route('**/api/save-recording', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    });
  });

  const recorder = new RecorderPage(page);
  await recorder.createTestRecording();
  await recorder.saveToLibrary();

  // Verify error handling
  await expect(page.locator('.error-toast')).toContainText('Failed to save recording');
});
```

### Network Condition Testing
```typescript
test('offline functionality', async ({ page, context }) => {
  // Set offline
  await context.setOffline(true);

  const recorder = new RecorderPage(page);
  await recorder.goto();

  // Attempt recording (should work offline)
  await recorder.selectRecordingType('camera');
  await recorder.startRecording();

  // Should work without network
  await expect(recorder.recordingIndicator).toBeVisible();
});
```

## Test Data Management

### Test Fixtures
```typescript
// test-data/fixtures.ts
export const testRecordings = {
  short: {
    duration: 5000,
    type: 'camera',
    quality: 'high'
  },
  long: {
    duration: 300000, // 5 minutes
    type: 'screen-camera',
    quality: 'medium'
  },
  audio: {
    duration: 10000,
    type: 'audio',
    quality: 'high'
  }
};

export const testUsers = {
  free: { role: 'free', features: [] },
  pro: { role: 'pro', features: ['advanced_editing'] },
  enterprise: { role: 'enterprise', features: ['team_collaboration'] }
};
```

### Test Helpers
```typescript
// utils/test-helpers.ts
export async function loginUser(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.fill('[name="email"]', user.email);
  await page.fill('[name="password"]', user.password);
  await page.click('[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function createMockRecording(page: Page, options: RecordingOptions) {
  // Mock MediaRecorder and create test recording
  await page.addScriptTag({
    content: `
      window.mockRecording = ${JSON.stringify(options)};
    `
  });
}

export async function waitForRecordingComplete(page: Page) {
  await page.waitForFunction(() => {
    return !document.querySelector('[data-recording="true"]');
  });
}
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npx playwright install
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### Parallel Test Execution
```typescript
// playwright.config.ts - Parallel execution
export default defineConfig({
  workers: process.env.CI ? 2 : undefined, // Run tests in parallel
  shard: process.env.SHARD, // For sharding large test suites
  retries: process.env.CI ? 2 : 0, // Retry failures in CI
  reporter: process.env.CI ? 'github' : 'list'
});
```

## Test Reporting & Analytics

### Custom Reporting
```typescript
// custom-reporter.ts
class CustomReporter implements Reporter {
  onTestEnd(test, result) {
    // Send test results to analytics
    analytics.track('test_completed', {
      test: test.title,
      duration: result.duration,
      status: result.status,
      browser: test.parent.project?.name
    });
  }
}
```

### Performance Metrics
```typescript
test('performance metrics collection', async ({ page }) => {
  const recorder = new RecorderPage(page);

  // Start performance monitoring
  await page.evaluate(() => {
    window.performance.mark('test-start');
  });

  await recorder.goto();
  await recorder.createTestRecording();

  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    window.performance.mark('test-end');
    window.performance.measure('test-duration', 'test-start', 'test-end');

    return {
      duration: window.performance.getEntriesByName('test-duration')[0].duration,
      memory: (window.performance as any).memory,
      timing: window.performance.timing
    };
  });

  // Log metrics for analysis
  console.log('Performance metrics:', metrics);
});
```

## Maintenance & Evolution

### Test Maintenance
- Regular review of flaky tests
- Update selectors when UI changes
- Maintain test data freshness
- Monitor test execution times

### Test Coverage Expansion
- Add tests for new features
- Increase browser coverage
- Add mobile-specific tests
- Implement visual regression for all pages

### Performance Benchmarks
- Establish baseline performance metrics
- Monitor for performance regressions
- Set up alerts for performance degradation
- Regular performance testing schedule

This Playwright test plan provides a comprehensive framework for automated testing of the recorder page, ensuring quality, reliability, and maintainability across all supported platforms and scenarios.
