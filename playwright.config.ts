import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './playwright/tests',
  timeout: 30000,
  use: {
  baseURL: 'http://localhost:8080', // match Vite dev server used in this session
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
  command: 'npm run dev',
  url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 120000
  }
};

export default config;
