import type { Browser, Page } from '@playwright/test'
import { test, expect, gotoReady, typeCorrect } from './helpers'

// 네트워크 의존: trystero가 공개 nostr 릴레이로 WebRTC 연결을 주선함. 릴레이 상태에 따라 실패할 수 있음
const PROD = 'http://localhost:5198/'
const DEV = 'http://localhost:5199/'

async function twoPlayers(browser: Browser, base: string, connectTimeout = 90_000) {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  const log: string[] = []
  for (const [n, p] of [
    ['A', a],
    ['B', b],
  ] as const) {
    p.on(
      'console',
      (m) => (m.type() === 'error' || m.type() === 'warning') && log.push(`${n} [${m.type()}] ${m.text()}`),
    )
    p.on('pageerror', (e) => log.push(`${n} [pageerror] ${e.message}`))
  }
  await gotoReady(a, base)
  await a.getByRole('button', { name: '친구랑 대결' }).click()
  await expect(a).toHaveURL(/\?room=\w+/)
  await a.locator('.room input').fill('에이')
  await gotoReady(b, a.url())
  await b.locator('.room input').fill('비')
  await expect(a.locator('.players li')).toHaveCount(2, { timeout: connectTimeout })
  await expect(b.locator('.players li')).toHaveCount(2, { timeout: 30_000 })
  const close = async () => {
    if (log.length) console.log('race console:\n  ' + [...new Set(log)].join('\n  '))
    await ctxA.close()
    await ctxB.close()
  }
  return { a, b, close }
}

const barOf = (p: Page, who: string) =>
  p
    .locator('.players li', { hasText: who })
    .locator('.bar > span')
    .evaluate((el) => parseFloat((el as HTMLElement).style.width))

test.describe('친구랑 대결 (네트워크 의존)', () => {
  test.setTimeout(180_000)

  test('두 브라우저 연결 → 동시 카운트다운 → 진행 공유', async ({ browser }) => {
    test.info().annotations.push({ type: 'network', description: 'public nostr relays + WebRTC, production build' })
    const { a, b, close } = await twoPlayers(browser, PROD)
    try {
      await expect(a.locator('.players')).toContainText('비', { timeout: 15_000 })
      await expect(b.locator('.players')).toContainText('에이', { timeout: 15_000 })
      // 대기 중엔 잠김
      await expect(a.locator('.code.fade')).toBeVisible()
      await a.locator('h1').click()
      await b.locator('h1').click()
      await a.keyboard.type('x')
      await expect(a.locator('.code .done, .code .wrong')).toHaveCount(0)

      await a.keyboard.press('Enter')
      await expect(a.locator('.count')).toBeVisible()
      await expect(b.locator('.count')).toBeVisible({ timeout: 10_000 })
      const fnA = await a.locator('.fns button.on').textContent()
      await expect(b.locator('.fns button.on')).toHaveText(fnA!)
      await expect(b.locator('.libs button').first()).toBeDisabled() // 대결 중엔 함수 못 바꿈
      await expect(a.locator('.count')).toHaveCount(0, { timeout: 6000 })
      await expect(b.locator('.count')).toHaveCount(0, { timeout: 6000 })

      await typeCorrect(a, 15)
      await expect.poll(() => barOf(b, '에이'), { timeout: 10_000 }).toBeGreaterThan(0)
      await expect(b.locator('.code [style*="box-shadow"]')).toHaveCount(1) // 상대 커서 표시
      await typeCorrect(b, 5)
      await expect.poll(() => barOf(a, '비'), { timeout: 10_000 }).toBeGreaterThan(0)

      // A가 끝까지 → 등수 표시
      await typeCorrect(a)
      await expect(a.locator('.result')).toBeVisible()
      await expect(a.locator('.players li').first()).toContainText('1등')
      await expect(b.locator('.players li', { hasText: '에이' })).toContainText('1등', { timeout: 10_000 })
      await expect(b.locator('.players li', { hasText: '에이' }).locator('.pcpm')).toContainText('초')
    } finally {
      await close()
    }
  })

  test('회귀: 이름 칸에 포커스가 남아 있어도 출발하면 게임 키가 먹음', async ({ browser }) => {
    const { a, b, close } = await twoPlayers(browser, PROD)
    try {
      await a.locator('h1').click()
      await a.keyboard.press('Enter')
      await expect(b.locator('.count')).toBeVisible({ timeout: 10_000 })
      await expect(b.locator('.count')).toHaveCount(0, { timeout: 6000 })
      const ch = await b.evaluate(() => document.querySelector('.code .cur')!.firstChild!.textContent!)
      await b.keyboard.type(ch) // 사용자는 코드 상자를 보고 바로 침
      await expect(b.locator('.code .done')).not.toHaveCount(0, { timeout: 2000 })
      await expect(b.locator('.room input')).toHaveValue('비')
    } finally {
      await close()
    }
  })

  test('회귀: 개발 서버(StrictMode)에서도 방에 들어오면 서로 보임', async ({ browser }) => {
    const { close } = await twoPlayers(browser, DEV, 45_000)
    await close()
  })
})
