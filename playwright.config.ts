import { defineConfig } from '@playwright/test'

const DIST = 'node_modules/.cache/e2e-dist'

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
      // 배포본에서도 대결이 되는지 보려고 프로덕션 빌드를 따로 띄움 (개발 서버 대결은 race.spec.ts 회귀 테스트)
      command: `pnpm exec vite build --outDir ${DIST} --emptyOutDir --logLevel warn && pnpm exec vite preview --outDir ${DIST} --port 5198 --strictPort`,
      url: 'http://localhost:5198',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
