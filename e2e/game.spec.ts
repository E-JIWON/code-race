import { test, expect, open, curChar, press, typeCorrect, curIndex, hudAccuracy, profile, pngSize } from './helpers'

test('첫 화면: 스니펫 로드·렌더', async ({ page, consoleLog }) => {
  await open(page)
  await expect(page.locator('h1')).toHaveText('코드 타자 레이스')
  await expect(page.locator('.libs button')).toHaveCount(6)
  await expect(page.locator('.libs button.on')).toHaveText('zustand')
  await expect(page.locator('.fns button.on')).toContainText('create')
  expect(await page.locator('.code .tx > span.todo, .code .tx > span.cur').count()).toBeGreaterThan(20)
  await expect(page.locator('.code .cm').first()).toBeVisible() // 한글 해설 주석
  await expect(page.locator('.hud')).toContainText('0.0')
  expect(consoleLog.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]'))).toEqual([])
})

test('한 판 끝까지: 결과·그래프·카드·프로필', async ({ page, consoleLog }) => {
  await open(page, 'redux-compose')
  await typeCorrect(page)
  const result = page.locator('.result')
  await expect(result).toBeVisible()
  await expect(result.locator('.big')).toContainText('타/분')
  await expect(result).toContainText('정확도 100%')
  await expect(result).toContainText('오타 0번')
  await expect(result.locator('.sub-stats')).toContainText('원시 타수')
  await expect(result.locator('.sub-stats')).toContainText('일관성')
  await expect(result.locator('svg.graph polyline.cpm')).toHaveCount(1)
  await expect(result.locator('.tip')).toBeVisible()
  await expect(result.locator('.weak')).toHaveCount(0) // 오타 없으면 약한 기호 없음
  await expect(result.locator('.actions button')).toHaveText([/고스트랑 다시/, /다음 함수/, /결과 이미지 저장/])
  await expect(page.locator('.rc .rc-left')).toBeVisible()
  await expect(page.locator('.rc .rc-right')).toBeVisible()
  await expect(page.locator('.rc-tier')).toHaveText(/개발자$/)
  expect(await page.locator('.rc-key').count()).toBeGreaterThan(40)
  await expect(page.locator('.rc-unit')).toContainText('Lv.1')
  expect((await profile(page)).plays).toBe(1)
  // 신기록 표시 + 최고 기록 저장
  await expect(result.locator('.record')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('code-race:best:redux-compose'))).not.toBeNull()
  // 끝난 뒤 키 입력은 무시
  await page.keyboard.type('abc')
  expect((await profile(page)).plays).toBe(1)
  expect(consoleLog.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]'))).toEqual([])
})

test('오타: .wrong 표시·정확도 하락·결과에 오타 수와 약한 기호', async ({ page }) => {
  await open(page, 'redux-compose')
  await typeCorrect(page, 3)
  const ch = await curChar(page)
  const bad = ch === 'q' ? 'z' : 'q'
  await page.keyboard.type(bad)
  await expect(page.locator('.code .cur.wrong')).toHaveCount(1)
  expect(await hudAccuracy(page)).toBeLessThan(100)
  await press(page, ch!)
  await expect(page.locator('.code .cur.wrong')).toHaveCount(0)
  await typeCorrect(page)
  await expect(page.locator('.result')).toContainText('오타 1번')
  await expect(page.locator('.result .weak code')).toHaveText([`${ch === ' ' ? '␣ 스페이스' : ch} ×1`])
  expect((await profile(page)).keyMiss).toEqual(ch!.trim() ? { [ch!]: 1 } : {})
})

test('첫 키가 틀리면 시계는 안 돌고 오타만 셈', async ({ page }) => {
  await open(page, 'redux-compose')
  await page.keyboard.type('#')
  await expect(page.locator('.code .cur.wrong')).toHaveCount(1)
  await page.waitForTimeout(300)
  await expect(page.locator('.hud span').nth(2).locator('b')).toHaveText('0.0')
})

test('한글 입력 경고', async ({ page }) => {
  await open(page, 'redux-compose')
  const before = await curIndex(page)
  // 한글 자판 상태에서 크롬이 보내는 keydown (Playwright 자판엔 한글 키가 없어서 직접 쏨)
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ㅁ' })))
  await expect(page.locator('.warn')).toContainText('한글 입력 중')
  // IME 조합 중 크롬이 보내는 key=Process
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Process' })))
  await expect(page.locator('.warn')).toBeVisible()
  expect(await curIndex(page)).toBe(before) // 커서 그대로, 오타도 아님
  await expect(page.locator('.code .cur.wrong')).toHaveCount(0)
  // 영어로 치면 경고 사라짐
  await press(page, (await curChar(page))!)
  await expect(page.locator('.warn')).toHaveCount(0)
})

test('Esc: 처음부터 다시 + 고스트', async ({ page }) => {
  await open(page, 'redux-compose')
  const start = await curIndex(page)
  await typeCorrect(page, 5)
  expect(await curIndex(page)).toBeGreaterThan(start)
  await page.keyboard.press('Escape')
  await expect.poll(() => curIndex(page)).toBe(start)
  await expect(page.locator('.code .done')).toHaveCount(0)
  await expect(page.locator('.hud span').nth(2).locator('b')).toHaveText('0.0')
  // 끝낸 다음 Esc → 고스트랑 다시
  await typeCorrect(page)
  await expect(page.locator('.result')).toBeVisible()
  // 봇이 너무 빨라서 고스트가 순식간에 끝나 버림 → 저장된 고스트 기록을 30배 느리게 늘림
  await page.evaluate(() => {
    const k = 'code-race:best:redux-compose'
    const b = JSON.parse(localStorage.getItem(k)!)
    b.trail = b.trail.map(([p, ms]: [number, number]) => [p, ms * 30 + 200])
    localStorage.setItem(k, JSON.stringify(b))
  })
  await page.keyboard.press('Escape')
  await expect(page.locator('.result')).toHaveCount(0)
  await expect(page.locator('.ghost-label')).toContainText('고스트')
  await expect(page.locator('.code .ghost')).toHaveCount(0) // 시작 전엔 고스트 없음
  await typeCorrect(page, 1)
  await expect(page.locator('.code .ghost')).toHaveCount(1, { timeout: 3000 }) // 고스트가 앞서 나감
})

test('Tab: 다음 함수, 라이브러리 탭 전환', async ({ page }) => {
  await open(page, 'redux-compose') // Redux의 마지막 함수 → 다음은 React 첫 함수
  await page.keyboard.press('Tab')
  await expect(page.locator('.libs button.on')).toHaveText('React')
  await expect(page.locator('.fns button.on')).toContainText('objectIs')
  await expect(page.locator('.code .cur')).toBeVisible()

  await page.locator('.libs button', { hasText: 'Jotai' }).click()
  await expect(page.locator('.libs button.on')).toHaveText('Jotai')
  await expect(page.locator('.fns button.on')).toContainText('atom')
  await expect(page.locator('.blurb')).not.toBeEmpty()
  await page.locator('.fns button', { hasText: 'useSetAtom' }).click()
  await expect(page.locator('.fns button.on')).toContainText('useSetAtom')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('code-race:last'))).toBe('"jotai-use-set-atom"')

  // 치는 중엔 Tab으로 안 넘어감
  await typeCorrect(page, 1)
  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)
  await expect(page.locator('.fns button.on')).toContainText('useSetAtom')
})

test('탭 버튼 클릭 뒤 스페이스·엔터가 버튼을 다시 누르지 않음', async ({ page }) => {
  await open(page, 'redux-compose')
  await page.locator('.libs button', { hasText: 'Redux' }).click() // 포커스가 버튼에 남음
  await expect(page.locator('.code .cur')).toBeVisible()
  const before = await curIndex(page)
  await typeCorrect(page, 8) // 'export d' — 스페이스 포함
  expect(await curIndex(page)).toBeGreaterThan(before)
  await expect(page.locator('.code .done')).not.toHaveCount(0)
  await expect(page.locator('.fns button.on')).toContainText('combineReducers')
})

test('자동완성: 여는 괄호가 닫는 괄호를 채우고, 덮어쓰기는 오타 아님', async ({ page }) => {
  await open(page, 'redux-compose')
  // 첫 ( 까지
  while ((await curChar(page)) !== '(') await press(page, (await curChar(page))!)
  await page.keyboard.type('(')
  const filled = page.locator('.code .filled')
  await expect(filled).toHaveCount(1)
  await expect(filled).toHaveText(')')
  const fIdx = await page.evaluate(() =>
    [...document.querySelectorAll('.code .tx > span')].findIndex((s) => s.classList.contains('filled')),
  )
  // 채워진 ) 를 지날 때까지
  while ((await curIndex(page)) < fIdx) await press(page, (await curChar(page))!)
  const next = await curChar(page)
  if (next !== ')') {
    await page.keyboard.type(')') // 습관적으로 친 닫는 괄호
    await expect(page.locator('.code .cur.wrong')).toHaveCount(0)
    expect(await hudAccuracy(page)).toBe(100)
  }
  // 두 번 치면 그땐 오타
  if (next !== ')') {
    await page.keyboard.type(')')
    await expect(page.locator('.code .cur.wrong')).toHaveCount(1)
  }
})

test('회귀: 자동완성 연달아 채워진 닫는 괄호 두 개를 습관대로 다 쳐도 오타 아님', async ({ page }) => {
  // redux-compose 마지막 줄 a(b(...args)) — 두 ( 가 모두 ) 를 채워서 args 뒤에서 )) 를 한 번에 건너뜀
  await open(page, 'redux-compose')
  let skipped: string[] = []
  for (let i = 0; i < 2000; i++) {
    const before = await page.evaluate(() => {
      const spans = [...document.querySelectorAll('.code .tx > span')]
      return {
        cur: spans.findIndex((s) => s.classList.contains('cur')),
        filled: spans.flatMap((s, i) => (s.classList.contains('filled') ? [i] : [])),
      }
    })
    const ch = await curChar(page)
    if (ch === null) break
    await press(page, ch)
    const after = await curIndex(page)
    const jumped = before.filled.filter((f) => f > before.cur && (after < 0 || f < after))
    if (jumped.length >= 2) {
      skipped = await page.evaluate(
        (idx) => idx.map((i) => document.querySelectorAll('.code .tx > span')[i].textContent!),
        jumped,
      )
      break
    }
  }
  expect(skipped.length).toBeGreaterThanOrEqual(2)
  for (const c of skipped) await page.keyboard.type(c)
  await expect(page.locator('.code .cur.wrong')).toHaveCount(0)
  expect(await hudAccuracy(page)).toBe(100)
})

test('자동완성 끔: 닫는 괄호를 직접 쳐야 함', async ({ page }) => {
  await open(page, 'redux-compose')
  await page.locator('.assist').click()
  await expect(page.locator('.assist')).toHaveText('자동완성 끔')
  while ((await curChar(page)) !== '(') await press(page, (await curChar(page))!)
  await page.keyboard.type('(')
  await expect(page.locator('.code .filled')).toHaveCount(0)
  await page.keyboard.type('e') // 'export' 두 글자 넘게 쳐도 제안 없음
  await expect(page.locator('.suggest')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.assist')).toHaveText('자동완성 끔')
})

test('자동완성: Tab 단어 완성', async ({ page }) => {
  await open(page, 'redux-compose')
  await typeCorrect(page, 2) // 'ex'
  const suggest = page.locator('.suggest')
  await expect(suggest).toBeVisible()
  await expect(suggest).toContainText('export')
  await page.keyboard.press('Tab')
  await expect(suggest).toHaveCount(0)
  expect(await curChar(page)).toBe(' ')
  await expect(page.locator('.fns button.on')).toContainText('compose') // 다음 함수로 안 넘어감
  await typeCorrect(page)
  await expect(page.locator('.result')).toContainText('정확도 100%')
})

test('끝낸 함수 칩에 ✓', async ({ page }) => {
  await open(page, 'redux-compose')
  await expect(page.locator('.fns button.on .check')).toHaveCount(0)
  await typeCorrect(page)
  await expect(page.locator('.fns button.on .check')).toHaveText('✓')
  await page.reload()
  await expect(page.locator('.fns button', { hasText: 'compose' }).locator('.check')).toHaveText('✓')
})

test('결과 이미지 저장 4종 (PNG 크기 확인)', async ({ page }, info) => {
  await open(page, 'redux-compose')
  await typeCorrect(page)
  const cases: [string, string, number, number][] = [
    ['.result .save', 'code-race-redux-compose.png', 400, 300],
    ['.rc-actions button:nth-child(1)', 'code-race-card.png', 600, 300],
    ['.rc-actions button:nth-child(2)', 'code-race-card-left.png', 300, 300],
    ['.rc-actions button:nth-child(3)', 'code-race-card-right.png', 300, 300],
  ]
  const sizes: Record<string, unknown> = {}
  for (const [sel, name, minW, minH] of cases) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator(sel).click()])
    expect(dl.suggestedFilename()).toBe(name)
    const path = info.outputPath(name)
    await dl.saveAs(path)
    const buf = (await import('node:fs')).readFileSync(path)
    const { w, h } = pngSize(buf)
    sizes[name] = { w, h, bytes: buf.length }
    expect(w).toBeGreaterThan(minW)
    expect(h).toBeGreaterThan(minH)
    expect(buf.length).toBeGreaterThan(20_000)
  }
  console.log('png sizes', JSON.stringify(sizes))
  // 합친 카드가 왼쪽·오른쪽보다 넓어야 함 (데스크톱에선 가로로 나란히)
  const s = sizes as Record<string, { w: number }>
  expect(s['code-race-card.png'].w).toBeGreaterThan(s['code-race-card-left.png'].w)
})

test('localStorage: 마지막 함수·이름 유지', async ({ page }) => {
  await open(page, 'nanoid')
  await expect(page.locator('.fns button.on')).toContainText('nanoid')
  await expect(page.locator('.libs button.on')).toHaveText('작은 명품 유틸')
  await page.locator('.fns button', { hasText: 'clsx' }).click()
  await expect(page.locator('.fns button.on')).toContainText('clsx')
  await page.reload()
  await expect(page.locator('.fns button.on')).toContainText('clsx')

  await page.getByRole('button', { name: '친구랑 대결' }).click()
  const input = page.locator('.room input')
  await input.fill('테스트봇')
  await page.reload()
  await expect(page.locator('.room input')).toHaveValue('테스트봇')
  expect(await page.evaluate(() => localStorage.getItem('code-race:name'))).toBe('"테스트봇"')
  await expect(page).toHaveURL(/\?room=/)
})

test('이름 칸에서 치는 글자는 게임에 안 들어감', async ({ page }) => {
  await open(page, 'redux-compose')
  await page.getByRole('button', { name: '친구랑 대결' }).click()
  await page.locator('.room input').fill('')
  await page.locator('.room input').type('ab')
  await expect(page.locator('.code .done')).toHaveCount(0)
  await expect(page.locator('.code .wrong')).toHaveCount(0)
  await page.getByRole('button', { name: '혼자 하기' }).click()
  await expect(page).not.toHaveURL(/room=/)
  await expect(page.locator('.room')).toHaveCount(0)
})

test('모바일 375px: 가로 넘침 없음 (코드 상자만 스크롤)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await open(page, 'redux-compose')
  const overflow = () =>
    page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const bad = [...document.querySelectorAll('body *')]
        .filter((el) => !el.closest('.code, .libs, .fns, .rc .term')) // 카드 창 안쪽 잘림은 아래 따로 검사
        .filter((el) => el.getBoundingClientRect().right > vw + 1)
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(el.getBoundingClientRect().right)}`,
        )
      return { scroll: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 10) }
    })
  let o = await overflow()
  expect(o.bad, JSON.stringify(o)).toEqual([])
  expect(o.scroll).toBeLessThanOrEqual(o.vw)
  const code = await page.locator('.code').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }))
  expect(code.sw).toBeGreaterThanOrEqual(code.cw)

  await typeCorrect(page)
  await expect(page.locator('.rc')).toBeVisible()
  o = await overflow()
  expect(o.bad, JSON.stringify(o)).toEqual([])
  expect(o.scroll).toBeLessThanOrEqual(o.vw)

  await page.getByRole('button', { name: '친구랑 대결' }).click()
  await expect(page.locator('.room')).toBeVisible()
  o = await overflow()
  expect(o.bad, JSON.stringify(o)).toEqual([])
})

test('회귀: 모바일 375px 결과 카드 손가락 지도가 잘리지 않음', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await open(page, 'redux-compose')
  await typeCorrect(page)
  const clipped = await page.evaluate(() => {
    const t = document.querySelector('.rc-left')!.getBoundingClientRect()
    return [...document.querySelectorAll('.rc-left .rc-key')]
      .filter((k) => k.getBoundingClientRect().right > t.right || k.getBoundingClientRect().left < t.left)
      .map((k) => k.textContent)
  })
  expect(clipped).toEqual([])
})

test('회귀: 불러오기 실패 → 다시 시도가 실패한 함수를 다시 불러옴', async ({ page }) => {
  await open(page, 'redux-compose')
  await page.route('https://raw.githubusercontent.com/**', (r) => r.abort())
  await page.locator('.libs button', { hasText: 'Jotai' }).click()
  await expect(page.getByText('코드를 못 불러왔어요')).toBeVisible()
  await page.unroute('https://raw.githubusercontent.com/**')
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(page.locator('.code .cur')).toBeVisible()
  // 실패한 Jotai가 아니라 원래 보던 함수로 돌아감 → 사용자가 고른 걸 다시 시도해야 자연스러움
  await expect(page.locator('.libs button.on')).toHaveText('Jotai')
})
