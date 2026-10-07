// 카드 시안: 개발자 유형(채택 후보) + 개발자만 알아보는 형식 4종
import { useRef, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { AXES, DAILY, KEY_MISS, PROFILE, SAMPLE, STATS, TYPE_SUB, TYPE_TITLE, type Tier, type TierId } from './tiers'
import { useTilt } from './useTilt'

// 카드 하나 + 이미지 저장 버튼 (다섯 시안이 같이 씀)
function Shareable({ name, children, hint }: { name: string; children: ReactNode; hint: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const save = () => {
    if (!ref.current) return
    void toPng(ref.current, { pixelRatio: 2 }).then((url) => {
      const a = document.createElement('a')
      a.href = url
      a.download = `code-race-${name}.png`
      a.click()
    })
  }
  return (
    <div className="card-stage">
      <div ref={ref} className="card-capture">{children}</div>
      <p className="lab-hint">{hint}</p>
      <button className="save" onClick={save}>이미지 저장</button>
    </div>
  )
}

// ───── 1. 개발자 유형 카드 (MBTI식) ─────
function typeOf(tier: Tier) {
  return [
    tier.acc < 97 ? 'R' : 'C',
    PROFILE.consistency >= 75 ? 'S' : 'B',
    PROFILE.assist ? 'A' : 'M',
    /[a-z]/i.test(PROFILE.weakKey) ? 'W' : 'Y',
  ]
}
const flip: Record<string, string> = { R: 'C', C: 'R', S: 'B', B: 'S', A: 'M', M: 'A', Y: 'W', W: 'Y' }

export function TypeCard({ tier }: { tier: Tier }) {
  const tilt = useTilt<HTMLDivElement>(10)
  const code = typeOf(tier)
  const mate = code.map((c, i) => (i < 2 ? flip[c] : c))
  const strength = [tier.acc < 97 ? 100 - tier.acc * 0.6 : tier.acc - 40, PROFILE.consistency, 72, 80]
  return (
    <Shareable name="type" hint="마우스로 기울여 보세요">
      <div ref={tilt} className={`type-card t-${code[0]}${code[1]}`}>
        <p className="type-kicker">나의 개발자 유형</p>
        <p className="type-code">{code.join('')}</p>
        <p className="type-title">{TYPE_TITLE[code[0] + code[1]]}</p>
        <p className="type-sub">{TYPE_SUB[code[2] + code[3]]}</p>
        <ul className="type-axes">
          {AXES.map((ax, i) => {
            const leftSide = code[i] === ax.left[0]
            return (
              <li key={ax.label}>
                <span className={leftSide ? 'on' : ''}>{ax.left[1]}</span>
                <span className="bar"><i style={{ left: `${leftSide ? 100 - strength[i] : strength[i]}%` }} /></span>
                <span className={leftSide ? '' : 'on'}>{ax.right[1]}</span>
              </li>
            )
          })}
        </ul>
        <p className="type-mate">잘 맞는 짝꿍 <b>{mate.join('')}</b> {TYPE_TITLE[mate[0] + mate[1]]}</p>
        <p className="type-foot">{tier.cpm}타 · 정확도 {tier.acc}% · 코드 타자 레이스</p>
      </div>
    </Shareable>
  )
}

// ───── 2. 키보드 지도 — 자주 틀린 키가 달아오름 ─────
const KEY_ROWS: [string, string][][] = [
  [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+']],
  [...'qwertyuiop'].map((k): [string, string] => [k, '']).concat([['[', '{'], [']', '}'], ['\\', '|']]),
  [...'asdfghjkl'].map((k): [string, string] => [k, '']).concat([[';', ':'], ["'", '"']]),
  [...'zxcvbnm'].map((k): [string, string] => [k, '']).concat([[',', '<'], ['.', '>'], ['/', '?']]),
]
const MAX_MISS = Math.max(...Object.values(KEY_MISS))

export function KeyMap({ tier }: { tier: Tier }) {
  const worst = Object.entries(KEY_MISS).sort((a, b) => b[1] - a[1]).slice(0, 3)
  return (
    <Shareable name="keymap" hint="자주 틀린 키일수록 빨갛게 달아올라요">
      <div className="keymap">
        <header>
          <p className="km-kicker">{SAMPLE.player}의 손가락 지도</p>
          <p className="km-title">닫는 괄호에서 가장 많이 미끄러져요</p>
        </header>
        <div className="km-board">
          {KEY_ROWS.map((row, r) => (
            <div key={r} className="km-row" style={{ paddingLeft: `${r * 14}px` }}>
              {row.map(([k, shift]) => {
                const miss = Math.max(KEY_MISS[k] ?? 0, KEY_MISS[shift] ?? 0)
                return (
                  <span key={k} className="km-key" style={{ '--heat': `${Math.round((miss / MAX_MISS) * 100)}%` } as React.CSSProperties}>
                    {shift && <small>{shift}</small>}
                    {k}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
        <footer>
          {worst.map(([k, v]) => <span key={k}><code>{k}</code> {v}%</span>)}
          <span className="km-tier">{tier.name} · {tier.cpm}타</span>
        </footer>
      </div>
    </Shareable>
  )
}

// ───── 3. neofetch 터미널 ─────
const LOGO = [
  '  ____ ____',
  ' / ___|  _ \\',
  '| |   | |_) |',
  '| |___|  _ <',
  ' \\____|_| \\_\\',
].join('\n')

export function Neofetch({ tier }: { tier: Tier }) {
  const rows: [string, string][] = [
    ['등급', tier.name],
    ['타수', `${tier.cpm}타/분 (${tier.rank})`],
    ['정확도', `${tier.acc}%`],
    ['일관성', `${PROFILE.consistency}%`],
    ['플레이', `${PROFILE.plays}판 · ${PROFILE.minutes}분`],
    ['주력', PROFILE.libs[0].name],
    ['약점', `${PROFILE.weakKey}  (닫는 괄호)`],
    ['자동완성', PROFILE.assist ? '켬' : '끔'],
  ]
  return (
    <Shareable name="neofetch" hint="개발자들이 내 컴퓨터 자랑할 때 쓰는 그 화면">
      <div className={`term tt-${tier.id}`}>
        <div className="term-bar"><i /><i /><i /><span>{SAMPLE.player}@code-race: ~</span></div>
        <div className="term-body">
          <p className="term-cmd"><b>{SAMPLE.player}@code-race</b> ~ % neofetch</p>
          <div className="term-grid">
            <pre className="term-logo">{LOGO}</pre>
            <div className="term-info">
              <p className="term-host"><b>{SAMPLE.player}</b>@<b>code-race</b></p>
              <p className="term-rule">{'-'.repeat(18)}</p>
              {rows.map(([k, v]) => <p key={k}><b>{k}</b>: {v}</p>)}
              <p className="term-colors">{['#ff6b6b', '#ffd36b', '#7dd3a8', '#6bc7ff', '#c49bff', '#ff8cc6', '#e6e8ee'].map((c) => <i key={c} style={{ background: c }} />)}</p>
            </div>
          </div>
          <p className="term-cmd"><b>{SAMPLE.player}@code-race</b> ~ % <span className="term-caret" /></p>
        </div>
      </div>
    </Shareable>
  )
}

// ───── 4. RPG 능력치 ─────
function radarPoints(values: number[], r: number, c: number) {
  return values
    .map((v, i) => {
      const a = (Math.PI * 2 * i) / values.length - Math.PI / 2
      return `${c + Math.cos(a) * r * (v / 100)},${c + Math.sin(a) * r * (v / 100)}`
    })
    .join(' ')
}

export function RpgStats({ tier }: { tier: Tier }) {
  const C = 110
  const R = 82
  return (
    <Shareable name="rpg" hint="여섯 능력치 · 레벨은 플레이 판 수">
      <div className={`rpg rp-${tier.id}`}>
        <header>
          <div>
            <p className="rpg-class">{tier.name}</p>
            <p className="rpg-name">{SAMPLE.player} <span>Lv.{PROFILE.plays}</span></p>
          </div>
          <p className="rpg-cpm"><b>{tier.cpm}</b><small>타/분</small></p>
        </header>
        <div className="rpg-bars">
          <p><span>HP 정확도</span><i><b style={{ width: `${tier.acc}%` }} /></i><em>{tier.acc}</em></p>
          <p><span>MP 일관성</span><i><b className="mp" style={{ width: `${PROFILE.consistency}%` }} /></i><em>{PROFILE.consistency}</em></p>
        </div>
        <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className="rpg-radar" aria-label="능력치 육각형">
          {[1, 0.66, 0.33].map((k) => (
            <polygon key={k} points={radarPoints(STATS.map(() => 100 * k), R, C)} className="rpg-grid" />
          ))}
          <polygon points={radarPoints(STATS.map((s) => s.value), R, C)} className="rpg-shape" />
          {STATS.map((s, i) => {
            const a = (Math.PI * 2 * i) / STATS.length - Math.PI / 2
            return (
              <text key={s.key} x={C + Math.cos(a) * (R + 18)} y={C + Math.sin(a) * (R + 18) + 4} textAnchor="middle">
                {s.key} {s.value}
              </text>
            )
          })}
        </svg>
        <ul className="rpg-skills">
          <li><b>패시브</b> 자동완성 — Tab 한 번에 단어가 완성됨</li>
          <li><b>디버프</b> 괄호 미아 — `)` 앞에서 9% 확률로 미끄러짐</li>
        </ul>
      </div>
    </Shareable>
  )
}

// ───── 5. 타자 잔디 ─────
const GRASS: Record<TierId, string[]> = {
  sprout: ['#1b2a1e', '#2d5a33', '#3f8a46', '#5fb862', '#8de08a'],
  mid: ['#1a2230', '#1f4f8a', '#2b72c2', '#4f9bf0', '#8cc3ff'],
  pro: ['#2a2312', '#6b4c12', '#a8761c', '#e0a630', '#ffd36b'],
  king: ['#1e1833', '#4b2e8a', '#7048e8', '#a07dff', '#e2b6ff'],
}

export function Grass({ tier }: { tier: Tier }) {
  const level = (n: number) => (n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4)
  let streak = 0
  let best = 0
  for (const n of DAILY) {
    streak = n ? streak + 1 : 0
    best = Math.max(best, streak)
  }
  const total = DAILY.reduce((a, b) => a + b, 0)
  return (
    <Shareable name="grass" hint="깃허브 잔디처럼 하루하루 친 판 수">
      <div className="grass">
        <header>
          <p className="gr-title"><b>{total}판</b> 최근 20주 동안</p>
          <p className="gr-tier">{tier.name}</p>
        </header>
        <div className="gr-grid">
          {DAILY.map((n, i) => <i key={i} style={{ background: GRASS[tier.id][level(n)] }} title={`${n}판`} />)}
        </div>
        <footer>
          <span>연속 <b>{streak}일</b> · 최장 <b>{best}일</b></span>
          <span className="gr-legend">적음 {GRASS[tier.id].map((c) => <i key={c} style={{ background: c }} />)} 많음</span>
        </footer>
      </div>
    </Shareable>
  )
}
