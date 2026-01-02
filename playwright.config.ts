import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  retries: 0,
  reporter: [['list'], ['html']],
  timeout: 120000,
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:5000',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // Use development server so we don't require a production build (which may fail on CI/Windows)
    command: 'npm run dev',
    url: process.env.APP_URL || 'http://localhost:5000',
    reuseExistingServer: true,
    timeout: 180000,
    env: {
      NODE_ENV: 'development',
      SKIP_RATE_LIMIT: '1',
      // Force AI providers to fallback during CI/E2E to avoid external calls
      OPENAI_API_KEY: '',
      GEMINI_API_KEY: '',
    },
  },
});


