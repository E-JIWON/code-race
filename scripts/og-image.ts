// 링크 미리보기(OG) 이미지 만들기: pnpm og → public/og.png, public/og-invite.png (1200×630)
import { chromium } from '@playwright/test'

const CODE = [
  ['done', 'export const '],
  ['done', 'useBearStore'],
  ['todo', ' = create((set) => ({'],
  ['br', ''],
  ['cm', '  // 상태 하나와 구독자 Set 하나가 전부예요'],
  ['br', ''],
  ['todo', '  bears: 0,'],
  ['br', ''],
  ['todo', '  increase: () => set((s) => ({ bears: s.bears + 1 })),'],
  ['br', ''],
  ['todo', '}))'],
]

const page = (invite: boolean) => `<!doctype html><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0 }
body { width: 1200px; height: 630px; background: radial-gradient(circle at 85% 15%, #1d2a24, #0f1115 55%); color: #e6e8ee;
  font-family: -apple-system, 'Apple SD Gothic Neo', sans-serif; padding: 64px 72px; display: flex; flex-direction: column }
.kicker { color: #7dd3a8; font-size: 26px; font-weight: 700; letter-spacing: .04em }
h1 { font-size: 66px; font-weight: 900; letter-spacing: -.03em; margin-top: 10px }
.sub { color: #a3a9b6; font-size: 28px; margin-top: 14px; line-height: 1.45 }
.win { margin-top: 28px; border-radius: 16px; background: #0d1016; border: 2px solid #262c36; padding: 22px 28px; width: 100%;
  font: 600 25px/1.6 ui-monospace, 'SF Mono', Menlo, monospace; white-space: pre }
.done { color: #e6e8ee } .todo { color: #5c6370 } .cm { color: #7fa386; font-family: -apple-system, sans-serif; font-size: 21px }
.cur { background: #7dd3a8; color: #0f1115; border-radius: 3px }
.foot { margin-top: auto; display: flex; justify-content: space-between; align-items: center; color: #7d8492; font-size: 22px }
.chips span { margin-right: 10px; padding: 6px 14px; border-radius: 999px; border: 1px solid #2d3440; color: #c9d1d9 }
.lane { display: flex; align-items: center; gap: 14px; margin-top: 14px; font-size: 22px; color: #c9d1d9 }
.track { flex: 1; height: 10px; border-radius: 5px; background: #262c36; position: relative }
.track i { position: absolute; top: -9px; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #0f1115 }
</style>
<p class="kicker">${invite ? '⚔️ 대결 초대장' : '⌨️ 코드 타자 레이스'}</p>
<h1>${invite ? '친구가 코드 타자 대결에<br>초대했어요' : '진짜 오픈소스 코드를<br>치면서 읽는 타자 게임'}</h1>
${
  invite
    ? `<div class="win" style="white-space:normal;font-family:-apple-system,sans-serif">
        <div class="lane"><b style="width:120px;color:#7dd3a8">나</b><div class="track"><i style="left:62%;background:#7dd3a8"></i></div><span>🏁</span></div>
        <div class="lane"><b style="width:120px;color:#ffd36b">친구</b><div class="track"><i style="left:48%;background:#ffd36b"></i></div><span>🏁</span></div>
        <div class="lane"><b style="width:120px;color:#6bc7ff">너도?</b><div class="track"><i style="left:3%;background:#6bc7ff"></i></div><span>🏁</span></div>
      </div>`
    : `<div class="win">${CODE.map(([c, t], i) => (c === 'br' ? '\n' : i === 2 ? `<span class="cur">${t[0]}</span><span class="todo">${t.slice(1)}</span>` : `<span class="${c}">${t}</span>`)).join('')}</div>`
}
<div class="foot"><div class="chips"><span>zustand</span><span>TanStack Query</span><span>Redux</span><span>React</span></div><span>code-race.bonchil.workers.dev</span></div>`

const browser = await chromium.launch({ channel: 'chrome' })
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } })
for (const [file, invite] of [
  ['public/og.png', false],
  ['public/og-invite.png', true],
] as const) {
  await tab.setContent(page(invite))
  await tab.screenshot({ path: file })
  console.log(file)
}
await browser.close()
