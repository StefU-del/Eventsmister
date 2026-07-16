import { defineConfig, devices } from '@playwright/test'

const frontendUrl = 'http://127.0.0.1:5174'
const backendUrl = 'http://127.0.0.1:8001'
const pythonCommand = process.env.CI ? 'python' : '../.venv/bin/python'
const databaseUrl = `sqlite:////tmp/eventsmister-e2e-${process.pid}.db`
const uploadDirectory = `/tmp/eventsmister-e2e-uploads-${process.pid}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: [
    {
      command: `cd ../backend && ${pythonCommand} -m uvicorn app.main:app --host 127.0.0.1 --port 8001`,
      url: `${backendUrl}/`,
      timeout: 30_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        SECRET_KEY: 'e2e-secret-key-used-only-for-tests',
        DATABASE_URL: databaseUrl,
        FRONTEND_ORIGINS: frontendUrl,
        UPLOAD_DIRECTORY: uploadDirectory,
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174',
      url: frontendUrl,
      timeout: 30_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        VITE_API_BASE_URL: backendUrl,
      },
    },
  ],
})
