import { test as base, expect, type Page } from '@playwright/test'

// 콘솔 에러·경고와 페이지 예외를 모아 두고, 테스트 끝에 출력 + 첨부
export const test = base.extend<{ consoleLog: string[] }>({
  consoleLog: async ({ page }, use, info) => {
    const log: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') log.push(`[${m.type()}] ${m.text()}`)
    })
    page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}`))
    await use(log)
    if (log.length) {
      console.log(`console (${info.title}):\n  ${log.join('\n  ')}`)
      await info.attach('console', { body: log.join('\n') })
    }
  },
})
export { expect }

// 지정한 스니펫으로 시작 (마지막 선택 localStorage를 심고 새로고침)
export async function open(page: Page, id?: string, extra: Record<string, unknown> = {}) {
  await gotoReady(page, '/')
  await page.evaluate(
    ([id, extra]) => {
      localStorage.clear()
      if (id) localStorage.setItem('code-race:last', JSON.stringify(id))
      for (const [k, v] of Object.entries(extra)) localStorage.setItem(`code-race:${k}`, JSON.stringify(v))
    },
    [id, extra] as const,
  )
  await gotoReady(page, '/')
}

// 개발 서버가 리팩터 도중 잠깐 깨질 수 있어서 코드가 뜰 때까지 몇 번 재시도
export async function gotoReady(page: Page, url: string) {
  for (let i = 0; ; i++) {
    await page.goto(url)
    try {
      await expect(page.locator('.code .cur')).toBeVisible({ timeout: 20_000 })
      return
    } catch (e) {
      if (i >= 3) throw e
      await page.waitForTimeout(3000)
    }
  }
}

// 커서 글자 (제안 팝업 텍스트는 빼고). 끝났으면 null
export const curChar = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector('.code .cur')
    if (!c) return null
    return c.classList.contains('nl') ? '\n' : (c.firstChild?.textContent ?? '')
  })

export async function press(page: Page, ch: string) {
  if (ch === '\n') await page.keyboard.press('Enter')
  else await page.keyboard.type(ch)
}

// n글자 (또는 끝까지) 정확히 침
export async function typeCorrect(page: Page, n = Infinity) {
  for (let i = 0; i < n; i++) {
    const ch = await curChar(page)
    if (ch === null) return
    await press(page, ch)
  }
}

export const curIndex = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('.code .tx > span')].findIndex((s) => s.classList.contains('cur')))

export const hudAccuracy = async (page: Page) =>
  Number(await page.locator('.hud span').nth(1).locator('b').textContent())

export const profile = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('code-race:profile') ?? 'null'))

// PNG 헤더에서 크기 읽기
export function pngSize(buf: Buffer) {
  expect(buf.subarray(1, 4).toString()).toBe('PNG')
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}
