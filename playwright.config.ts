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
      // 대결 테스트용 프로덕션 빌드 (개발 모드 StrictMode에선 방 연결이 안 됨 — race.spec.ts 참고)
      command: `pnpm exec vite build --outDir ${DIST} --emptyOutDir --logLevel warn && pnpm exec vite preview --outDir ${DIST} --port 5198 --strictPort`,
      url: 'http://localhost:5198',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
