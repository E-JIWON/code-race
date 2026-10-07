// README용 데모 GIF 만들기: pnpm demo:gif
// 개발 서버를 띄우고 Playwright로 실제 플레이를 찍은 뒤 gifenc로 묶어 docs/에 저장
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'
import gifenc, { type Palette } from 'gifenc'
import { PNG } from 'pngjs'

const { GIFEncoder, applyPalette, quantize } = gifenc // CommonJS 패키지라 기본 내보내기에서 꺼냄

const PORT = 5197
const BASE = `http://localhost:${PORT}`
const FPS = 6
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Frame = { data: Uint8Array; width: number; height: number }

const shot = async (page: Page): Promise<Frame> => {
  const png = PNG.sync.read(await page.screenshot())
  return { data: new Uint8Array(png.data), width: png.width, height: png.height }
}

// 두 화면을 가로로 붙임 (대결 데모)
function sideBySide(a: Frame, b: Frame, gap = 12): Frame {
  const width = a.width + gap + b.width
  const height = Math.max(a.height, b.height)
  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < data.length; i += 4) data.set([15, 17, 21, 255], i) // 페이지 배경색
  for (const [f, x0] of [
    [a, 0],
    [b, a.width + gap],
  ] as const)
    for (let y = 0; y < f.height; y++)
      data.set(f.data.subarray(y * f.width * 4, (y + 1) * f.width * 4), (y * width + x0) * 4)
  return { data, width, height }
}

// 캡처하는 동안 run()을 같이 돌림 — 끝나면 hold초 더 찍고 멈춤
async function record(capture: () => Promise<Frame>, run: () => Promise<void>, hold = 1.5) {
  const frames: Frame[] = []
  let done = false
  const job = run().then(() => (done = true))
  while (!done) {
    const t = Date.now()
    frames.push(await capture())
    await sleep(Math.max(0, 1000 / FPS - (Date.now() - t)))
  }
  await job
  for (let i = 0; i < hold * FPS; i++) frames.push(await capture())
  return frames
}

function writeGif(file: string, frames: Frame[]) {
  // 팔레트는 몇 장에서 뽑아 공유 — 프레임마다 색이 튀지 않고 용량도 줄어듦
  const samples = [0, 0.33, 0.66, 1].map((k) => frames[Math.floor(k * (frames.length - 1))])
  const merged = new Uint8Array(samples.reduce((n, f) => n + f.data.length, 0))
  let o = 0
  for (const f of samples) merged.set(f.data, (o += f.data.length) - f.data.length)
  const palette: Palette = quantize(merged, 256)
  const gif = GIFEncoder()
  for (const f of frames)
    gif.writeFrame(applyPalette(f.data, palette), f.width, f.height, { palette, delay: 1000 / FPS })
  gif.finish()
  writeFileSync(file, gif.bytes())
  console.log(`${file} — ${frames.length}프레임, ${(gif.bytes().length / 1024 / 1024).toFixed(1)}MB`)
}

// 페이지 안에서 사람처럼 치기: 가끔 오타, 자동완성 제안이 뜨면 Tab
async function typeLikeHuman(page: Page, { msPerKey = 70, typoEvery = 0, stopAfter = Infinity } = {}) {
  await page.evaluate(
    async ({ msPerKey, typoEvery, stopAfter }) => {
      const press = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key }))
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
      for (let n = 0; n < stopAfter; n++) {
        const cur = document.querySelector('.code .cur')
        if (!cur || document.querySelector('.result')) break
        if (document.querySelector('.suggest') && n % 3 === 0) {
          await wait(msPerKey * 4)
          press('Tab')
        } else {
          if (typoEvery && n % typoEvery === typoEvery - 1) {
            press('#')
            await wait(msPerKey * 3)
          }
          press(cur.classList.contains('nl') ? 'Enter' : cur.textContent!)
        }
        await wait(msPerKey * (0.6 + Math.random() * 0.8))
      }
    },
    { msPerKey, typoEvery, stopAfter },
  )
}

async function open(page: Page, snippet: string, name: string) {
  await page.addInitScript(
    ([s, n]) => {
      if (!localStorage.getItem('code-race:seeded')) {
        localStorage.setItem('code-race:last', JSON.stringify(s))
        localStorage.setItem('code-race:name', JSON.stringify(n))
        localStorage.setItem('code-race:seeded', '1')
      }
    },
    [snippet, name],
  )
  await page.goto(BASE)
  await page.locator('.code .cur').waitFor()
}

const server = spawn('pnpm', ['exec', 'vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const browser = await chromium.launch({ channel: 'chrome' })
mkdirSync('docs', { recursive: true })
try {
  for (let i = 0; i < 50; i++) {
    if (
      await fetch(BASE).then(
        (r) => r.ok,
        () => false,
      )
    )
      break
    await sleep(200)
  }

  // 1. 타자 — 오타·자동완성 Tab·한 판 완주
  {
    const ctx = await browser.newContext({ viewport: { width: 760, height: 600 } })
    const page = await ctx.newPage()
    await open(page, 'zustand-use-shallow', '봉칠')
    await page.locator('.code').scrollIntoViewIfNeeded()
    await page.mouse.wheel(0, 150)
    const frames = await record(
      () => shot(page),
      () => typeLikeHuman(page, { msPerKey: 75, typoEvery: 37 }),
    )
    writeGif('docs/demo-typing.gif', frames)

    // 2. 결과 — 그래프·팁 → 캐릭터 카드까지 천천히 스크롤
    const frames2 = await record(
      () => shot(page),
      async () => {
        await page.locator('.result').scrollIntoViewIfNeeded()
        await sleep(1500)
        for (let i = 0; i < 24; i++) {
          await page.mouse.wheel(0, 45)
          await sleep(110)
        }
        await sleep(2000)
      },
      0.5,
    )
    writeGif('docs/demo-result.gif', frames2)
    await ctx.close()
  }

  // 3. 대결 — 두 브라우저 나란히
  {
    const size = { width: 560, height: 760 }
    const a = await (await browser.newContext({ viewport: size })).newPage()
    const b = await (await browser.newContext({ viewport: size })).newPage()
    await open(a, 'redux-compose', '봉칠')
    await a.getByRole('button', { name: '친구랑 대결' }).click()
    await open(b, 'redux-compose', '고무오리')
    await b.goto(a.url())
    await a.locator('.players li', { hasText: '고무오리' }).waitFor({ timeout: 30_000 })
    await b.locator('.players li', { hasText: '봉칠' }).waitFor({ timeout: 30_000 })
    // 진행 막대와 코드가 한 화면에 오게
    for (const p of [a, b]) await p.evaluate(() => document.querySelector('.room')!.scrollIntoView())
    const frames = await record(
      async () => sideBySide(await shot(a), await shot(b)),
      async () => {
        await sleep(800)
        await a.keyboard.press('Enter')
        await a.locator('.count').waitFor()
        await a.locator('.count').waitFor({ state: 'detached', timeout: 10_000 })
        await Promise.all([typeLikeHuman(a, { msPerKey: 45 }), typeLikeHuman(b, { msPerKey: 65, typoEvery: 23 })])
        await sleep(800)
        for (const p of [a, b]) await p.evaluate(() => document.querySelector('.room')!.scrollIntoView())
      },
      2.5,
    )
    writeGif('docs/demo-race.gif', frames)
  }
} finally {
  await browser.close()
  server.kill()
}
