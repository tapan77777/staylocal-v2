import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './staging-tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  // Credentials, cookies and form input must not be persisted in artifacts.
  use: { trace: 'off', screenshot: 'off', video: 'off', ignoreHTTPSErrors: false },
})
