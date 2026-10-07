import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    channel: 'chrome',
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  webServer: [
    {
      command: 'pnpm exec vite --port 5199 --strictPort',
      url: 'http://localhost:5199',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // 배포본(빌드 + 방 서버)에서도 대결이 되는지 보려고 프로덕션 빌드를 따로 띄움
      command: 'pnpm exec vite build --logLevel warn && pnpm exec vite preview --port 5198 --strictPort',
      url: 'http://localhost:5198',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
