// 카드 시안: 개발자 유형(채택 후보) + 개발자만 알아보는 형식 4종
import { useRef, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { AXES, KEY_MISS, PROFILE, SAMPLE, STAT_LINE, STATS, TIER_MIN, TIERS, TYPE_SUB, TYPE_TITLE, type Tier } from './tiers'
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
      <div ref={ref} className="card-capture">
        {children}
      </div>
      <p className="lab-hint">{hint}</p>
      <button className="save" onClick={save}>
        이미지 저장
      </button>
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
const flip: Record<string, string> = {
  R: 'C',
  C: 'R',
  S: 'B',
  B: 'S',
  A: 'M',
  M: 'A',
  Y: 'W',
  W: 'Y',
}

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
                <span className="bar">
                  <i
                    style={{
                      left: `${leftSide ? 100 - strength[i] : strength[i]}%`,
                    }}
                  />
                </span>
                <span className={leftSide ? '' : 'on'}>{ax.right[1]}</span>
              </li>
            )
          })}
        </ul>
        <p className="type-mate">
          잘 맞는 짝꿍 <b>{mate.join('')}</b> {TYPE_TITLE[mate[0] + mate[1]]}
        </p>
        <p className="type-foot">
          {tier.cpm}타 · 정확도 {tier.acc}% · 코드 타자 레이스
        </p>
      </div>
    </Shareable>
  )
}

// ───── 공용 조각: 등급 사다리 · 오타 키보드 · 능력치 육각형 (여러 카드가 같이 씀) ─────
function TierLadder({ tier }: { tier: Tier }) {
  return (
    <div className={`ladder lt-${tier.id}`}>
      <p className="ladder-head">
        <b>{tier.name}</b>
        <span>
          {tier.cpm}타/분 · {tier.rank}
        </span>
      </p>
      <ol>
        {TIERS.map((t, i) => {
          const at = TIERS.indexOf(tier)
          return (
            <li key={t.id} className={i < at ? 'past' : i === at ? 'now' : ''}>
              {t.name.replace(' 개발자', '')}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function KeyHeat() {
  return (
    <div className="km-board">
      {KEY_ROWS.map((row, r) => (
        <div key={r} className="km-row" style={{ paddingLeft: `${r * 14}px` }}>
          {row.map(([k, shift]) => {
            const miss = Math.max(KEY_MISS[k] ?? 0, KEY_MISS[shift] ?? 0)
            return (
              <span
                key={k}
                className="km-key"
                style={
                  {
                    '--heat': `${Math.round((miss / MAX_MISS) * 100)}%`,
                  } as React.CSSProperties
                }
              >
                {shift && <small>{shift}</small>}
                {k}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function Radar({ className }: { className: string }) {
  const C = 110
  const R = 82
  return (
    <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className={className} aria-label="능력치 육각형">
      {[1, 0.66, 0.33].map((k) => (
        <polygon
          key={k}
          points={radarPoints(
            STATS.map(() => 100 * k),
            R,
            C,
          )}
          className="rpg-grid"
        />
      ))}
      <polygon
        points={radarPoints(
          STATS.map((s) => s.value),
          R,
          C,
        )}
        className="rpg-shape"
      />
      {STATS.map((s, i) => {
        const a = (Math.PI * 2 * i) / STATS.length - Math.PI / 2
        return (
          <text key={s.key} x={C + Math.cos(a) * (R + 18)} y={C + Math.sin(a) * (R + 18) + 4} textAnchor="middle">
            {s.key} {s.value}
          </text>
        )
      })}
    </svg>
  )
}

// ───── 2. 키보드 지도 — 자주 틀린 키가 달아오름 ─────
const KEY_ROWS: [string, string][][] = [
  [
    ['`', '~'],
    ['1', '!'],
    ['2', '@'],
    ['3', '#'],
    ['4', '$'],
    ['5', '%'],
    ['6', '^'],
    ['7', '&'],
    ['8', '*'],
    ['9', '('],
    ['0', ')'],
    ['-', '_'],
    ['=', '+'],
  ],
  [...'qwertyuiop']
    .map((k): [string, string] => [k, ''])
    .concat([
      ['[', '{'],
      [']', '}'],
      ['\\', '|'],
    ]),
  [...'asdfghjkl']
    .map((k): [string, string] => [k, ''])
    .concat([
      [';', ':'],
      ["'", '"'],
    ]),
  [...'zxcvbnm']
    .map((k): [string, string] => [k, ''])
    .concat([
      [',', '<'],
      ['.', '>'],
      ['/', '?'],
    ]),
]
const MAX_MISS = Math.max(...Object.values(KEY_MISS))

export function KeyMap({ tier }: { tier: Tier }) {
  const worst = Object.entries(KEY_MISS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  return (
    <Shareable name="keymap" hint="자주 틀린 키일수록 빨갛게 달아올라요">
      <div className="keymap">
        <header>
          <p className="km-kicker">{SAMPLE.player}의 손가락 지도</p>
          <p className="km-title">닫는 괄호에서 가장 많이 미끄러져요</p>
        </header>
        <TierLadder tier={tier} />
        <KeyHeat />
        <footer>
          <span className="km-label">가장 많이 틀린 키</span>
          {worst.map(([k, v]) => (
            <span key={k}>
              <code>{k}</code> {v}%
            </span>
          ))}
        </footer>
      </div>
    </Shareable>
  )
}

// ───── 3. 터미널 명함 (neofetch식) ─────
// 5줄짜리 블록 숫자 — 내 타수를 터미널 그림처럼 크게
const DIGITS: Record<string, string[]> = {
  '0': ['███', '█ █', '█ █', '█ █', '███'],
  '1': [' █ ', '██ ', ' █ ', ' █ ', '███'],
  '2': ['███', '  █', '███', '█  ', '███'],
  '3': ['███', '  █', '███', '  █', '███'],
  '4': ['█ █', '█ █', '███', '  █', '  █'],
  '5': ['███', '█  ', '███', '  █', '███'],
  '6': ['███', '█  ', '███', '█ █', '███'],
  '7': ['███', '  █', '  █', '  █', '  █'],
  '8': ['███', '█ █', '███', '█ █', '███'],
  '9': ['███', '█ █', '███', '  █', '███'],
}
const bigNumber = (n: number) => [0, 1, 2, 3, 4].map((r) => [...String(n)].map((d) => DIGITS[d][r]).join(' ')).join('\n')

export function Neofetch({ tier }: { tier: Tier }) {
  const rows: [string, string][] = [
    ['정확도', `${tier.acc}%`],
    ['일관성', `${PROFILE.consistency}%`],
    ['플레이', `${PROFILE.plays}판 · ${PROFILE.minutes}분`],
    ['주력', PROFILE.libs[0].name],
    ['약점', `${PROFILE.weakKey}  닫는 괄호`],
    ['자동완성', PROFILE.assist ? '켬' : '끔'],
  ]
  const ladder = TIERS.map((t) => (t.id === tier.id ? `[${t.name.replace(' 개발자', '')}]` : t.name.replace(' 개발자', ''))).join(
    ' ▸ ',
  )
  return (
    <Shareable name="terminal" hint="터미널에 내 타자 실력을 출력한 화면이에요">
      <div className={`term tt-${tier.id}`}>
        <div className="term-bar">
          <i />
          <i />
          <i />
          <span>내 타자 실력 — 코드 타자 레이스</span>
        </div>
        <div className="term-body">
          <p className="term-cmd">
            <b>{SAMPLE.player}@code-race</b> ~ % 내-실력 --보여줘
          </p>
          <div className="term-grid">
            <div className="term-left">
              <pre className="term-logo">{bigNumber(tier.cpm)}</pre>
              <p className="term-unit">타/분 · {tier.rank}</p>
            </div>
            <div className="term-info">
              <p className="term-grade">{tier.name}</p>
              <p className="term-ladder">{ladder}</p>
              <p className="term-rule">{'-'.repeat(22)}</p>
              {rows.map(([k, v]) => (
                <p key={k}>
                  <b>{k}</b>: {v}
                </p>
              ))}
            </div>
          </div>
          <p className="term-cmd">
            <b>{SAMPLE.player}@code-race</b> ~ % <span className="term-caret" />
          </p>
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
  return (
    <Shareable name="rpg" hint="여섯 능력치 · 레벨은 플레이 판 수">
      <div className={`rpg rp-${tier.id}`}>
        <header>
          <div>
            <p className="rpg-class">{tier.name}</p>
            <p className="rpg-name">
              {SAMPLE.player} <span>Lv.{PROFILE.plays}</span>
            </p>
          </div>
          <p className="rpg-cpm">
            <b>{tier.cpm}</b>
            <small>타/분</small>
          </p>
        </header>
        <div className="rpg-bars">
          <p>
            <span>HP 정확도</span>
            <i>
              <b style={{ width: `${tier.acc}%` }} />
            </i>
            <em>{tier.acc}</em>
          </p>
          <p>
            <span>MP 일관성</span>
            <i>
              <b className="mp" style={{ width: `${PROFILE.consistency}%` }} />
            </i>
            <em>{PROFILE.consistency}</em>
          </p>
        </div>
        <Radar className="rpg-radar" />
        <ul className="rpg-skills">
          <li>
            <b>패시브</b> 자동완성 — Tab 한 번에 단어가 완성됨
          </li>
          <li>
            <b>디버프</b> 괄호 미아 — `)` 앞에서 9% 확률로 미끄러짐
          </li>
        </ul>
      </div>
    </Shareable>
  )
}

const short = (t: Tier) => t.name.replace(' 개발자', '')

// ───── 5. 승급 PR (GitHub Pull Request) ─────
export function PromotionPR({ tier }: { tier: Tier }) {
  const i = TIERS.indexOf(tier)
  const prev = TIERS[i - 1]
  const checks: [boolean, string][] = [
    [true, `타수 ${tier.cpm} ≥ ${TIER_MIN[tier.id]} (${short(tier)} 기준)`],
    [tier.acc >= 95, `정확도 ${tier.acc}% ≥ 95%`],
    [true, `일관성 ${PROFILE.consistency}%`],
  ]
  return (
    <Shareable name="pr" hint="등급이 오르는 순간을 머지된 PR로">
      <div className="pr">
        <p className="pr-title">
          {prev ? (
            <>
              등급 승급: {short(prev)} → <b>{short(tier)}</b>
            </>
          ) : (
            <>
              첫 등급 획득: <b>{short(tier)}</b>
            </>
          )}
          <span> #{SAMPLE.serial.replace('No. ', '')}</span>
        </p>
        <p className="pr-meta">
          <span className="pr-state">머지됨</span>
          <b>{SAMPLE.player}</b> 님이 커밋 {PROFILE.plays}개를 <code>main</code>에 합쳤어요
        </p>
        <div className="pr-labels">
          <span style={{ '--c': '#7048e8' } as React.CSSProperties}>{tier.name}</span>
          <span style={{ '--c': '#f08c00' } as React.CSSProperties}>{PROFILE.libs[0].name}</span>
          <span style={{ '--c': '#1c7ed6' } as React.CSSProperties}>자동완성</span>
        </div>
        <div className="pr-box">
          <p className="pr-box-head">
            <i className="ok" />
            모든 검사를 통과했어요
          </p>
          {checks.map(([ok, text]) => (
            <p key={text} className="pr-check">
              <i className={ok ? 'ok' : 'warn'} />
              {text}
            </p>
          ))}
          <p className="pr-check">
            <i className="warn" />
            <code>)</code> 오타율 9% — 다음 판에서 고쳐 보세요
          </p>
        </div>
        <div className="pr-box pr-review">
          <p>
            <i className="ok" />
            <b>코드 타자 레이스 봇</b> 님이 변경 사항을 승인했어요
          </p>
          <p className="pr-ladder">
            {TIERS.map((t, k) => (
              <span key={t.id} className={k < i ? 'past' : k === i ? 'now' : ''}>
                {short(t)}
              </span>
            ))}
          </p>
        </div>
      </div>
    </Shareable>
  )
}

// ───── 6. README 배지 (shields.io) ─────
function ShieldBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="shield">
      <span>{label}</span>
      <span style={{ background: color }}>{value}</span>
    </span>
  )
}

export function ReadmeBadges({ tier }: { tier: Tier }) {
  const tierColor = {
    sprout: '#4c9a2a',
    mid: '#1c7ed6',
    pro: '#d4a017',
    king: '#7048e8',
  }[tier.id]
  return (
    <Shareable name="badges" hint="깃허브 프로필 README에 거는 배지 세트">
      <div className="readme">
        <p className="readme-path">
          {SAMPLE.player} / <b>README.md</b>
        </p>
        <div className="readme-body">
          <p className="readme-h1">안녕하세요, {SAMPLE.player}예요</p>
          <p className="readme-p">프론트엔드 개발자 · 오픈소스를 손으로 읽는 중</p>
          <div className="shields">
            <ShieldBadge label="코드 타자 레이스" value={tier.name} color={tierColor} />
            <ShieldBadge label="타수" value={`${tier.cpm}/분`} color="#2ea043" />
            <ShieldBadge label="정확도" value={`${tier.acc}%`} color="#3fb950" />
            <ShieldBadge label="순위" value={tier.rank} color="#0969da" />
            <ShieldBadge label="주력" value={PROFILE.libs[0].name} color="#f08c00" />
            <ShieldBadge label="약점" value={PROFILE.weakKey} color="#d1242f" />
          </div>
        </div>
      </div>
    </Shareable>
  )
}

// ───── 7. VS Code 명함 ─────
export function EditorCard({ tier }: { tier: Tier }) {
  const tc = {
    sprout: '#2f9e44',
    mid: '#1971c2',
    pro: '#d4a017',
    king: '#7048e8',
  }[tier.id]
  const S = ({ c, children }: { c: string; children: ReactNode }) => <span className={`tk-${c}`}>{children}</span>
  const lines: ReactNode[] = [
    <S c="cm">// 코드 타자 레이스 · {SAMPLE.date}</S>,
    <>
      <S c="kw">export const</S> <S c="var">{SAMPLE.player}</S> = {'{'}
    </>,
    <>
      {'  '}
      <S c="prop">등급</S>: <S c="str">'{tier.name}'</S>, <S c="cm">// {tier.rank}</S>
    </>,
    <>
      {'  '}
      <S c="prop">타수</S>: <S c="num">{tier.cpm}</S>,
    </>,
    <>
      {'  '}
      <S c="prop">정확도</S>: <S c="num">{(tier.acc / 100).toFixed(2)}</S>,
    </>,
    <>
      {'  '}
      <S c="prop">주력</S>: <S c="str">'{PROFILE.libs[0].name}'</S>,
    </>,
    <>
      {'  '}
      <S c="prop">약점</S>: <S c="str">'{PROFILE.weakKey}'</S>,
    </>,
    <>
      {'  '}
      <S c="prop">자동완성</S>: <S c="kw">{String(PROFILE.assist)}</S>,
    </>,
    <>
      {'}'} <S c="kw">satisfies</S> <S c="type">개발자</S>
    </>,
  ]
  return (
    <Shareable name="editor" hint="등급 위 툴팁의 타입이 곧 등급 사다리예요">
      <div className="editor" style={{ '--tc': tc } as React.CSSProperties}>
        <div className="ed-tabs">
          <span className="on">{SAMPLE.player}.ts</span>
          <span>타자기록.json</span>
        </div>
        <div className="ed-code">
          {lines.map((l, k) => (
            <div key={k}>
              <p className={k === 2 ? 'hover-line' : ''}>
                <span className="ed-no">{k + 1}</span>
                <span className="ed-tx">{l}</span>
              </p>
              {k === 2 && (
                <span className="ed-tip">
                  <S c="kw">(property)</S> <S c="prop">등급</S>:{' '}
                  {TIERS.map((t, j) => (
                    <span key={t.id} className={t.id === tier.id ? 'tip-now' : ''}>
                      <S c="str">'{short(t)}'</S>
                      {j < TIERS.length - 1 && <S c="op"> | </S>}
                    </span>
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="ed-status">
          <span>⎇ main</span>
          <span>✓ 문제 0</span>
          <span className="ed-right">{tier.cpm} 타/분</span>
          <span>{tier.name}</span>
          <span>TypeScript</span>
        </div>
      </div>
    </Shareable>
  )
}

// ───── 8. 개발자 캐릭터 시트 — 터미널 틀 + 큰 타수 + 사다리 / 키보드 지도 + 육각형 / 스킬 ─────
export function CharacterSheet({ tier, vertical = false }: { tier: Tier; vertical?: boolean }) {
  const worst = Object.entries(KEY_MISS).sort((a, b) => b[1] - a[1])[0]
  const top = STATS.reduce((a, b) => (b.value > a.value ? b : a))
  const [trait, desc] = STAT_LINE[top.key]
  return (
    <Shareable
      name={vertical ? 'sheet-vertical' : 'sheet'}
      hint={vertical ? '휴대폰 공유용 세로형 — 인스타 스토리 비율에 가깝게' : '터미널 명함 + 키보드 지도 + RPG 능력치를 한 장에'}
    >
      <div className={`term sheet tt-${tier.id} ${vertical ? 'vertical' : ''}`}>
        <div className="term-bar">
          <i />
          <i />
          <i />
          <span>내 타자 실력 — 코드 타자 레이스</span>
        </div>
        <div className="term-body">
          <p className="term-cmd">
            <b>{SAMPLE.player}@code-race</b> ~ % 내-실력 --보여줘
          </p>
          <div className="sheet-hero">
            <div>
              <pre className="term-logo">{bigNumber(tier.cpm)}</pre>
              <p className="term-unit">타/분 · 정확도 {tier.acc}% · Lv.{PROFILE.plays}</p>
            </div>
            <TierLadder tier={tier} />
          </div>
          <div className="sheet-mid">
            <div>
              <p className="sheet-label"># 손가락 지도 — 빨갈수록 자주 틀림</p>
              <KeyHeat />
            </div>
            <div>
              <p className="sheet-label"># 능력치</p>
              <div className="sheet-stats">
                <Radar className="rpg-radar sheet-radar" />
                <div className="sheet-verdict">
                  <p>당신은</p>
                  <p className="sheet-trait">{trait}</p>
                  <p>타입이군요!</p>
                  <p className="sheet-desc">{desc}</p>
                  <p className="sheet-top">
                    {top.key} <b>{top.value}</b>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="sheet-skill">
            <b className="plus">+ 패시브</b> 자동완성 — Tab 한 번에 단어 완성
          </p>
          <p className="sheet-skill">
            <b className="minus">- 디버프</b> 괄호 미아 — <code>{worst[0]}</code> 앞에서 {worst[1]}% 확률로 미끄러짐
          </p>
          <p className="term-cmd">
            <b>{SAMPLE.player}@code-race</b> ~ % <span className="term-caret" />
          </p>
        </div>
      </div>
    </Shareable>
  )
}

// 세로형 (휴대폰 공유용)
export const CharacterSheetVertical = ({ tier }: { tier: Tier }) => <CharacterSheet tier={tier} vertical />

// 좌우형 — 창 두 개: 왼쪽 = 내 실력(타수·등급·손가락 지도), 오른쪽 = 내 능력치(육각형·한마디·스킬)
export function SplitSheet({ tier }: { tier: Tier }) {
  const worst = Object.entries(KEY_MISS).sort((a, b) => b[1] - a[1])[0]
  const top = STATS.reduce((a, b) => (b.value > a.value ? b : a))
  const [trait, desc] = STAT_LINE[top.key]
  const bar = (title: string) => (
    <div className="term-bar">
      <i />
      <i />
      <i />
      <span>{title}</span>
    </div>
  )
  return (
    <Shareable name="sheet-split" hint="왼쪽은 실력, 오른쪽은 능력치 — 두 창을 나란히">
      <div className={`split tt-${tier.id}`}>
        <div className="term sheet vertical">
          {bar('내 타자 실력')}
          <div className="term-body">
            <p className="term-cmd">
              <b>{SAMPLE.player}@code-race</b> ~ % 내-실력
            </p>
            <div className="sheet-hero">
              <div>
                <pre className="term-logo">{bigNumber(tier.cpm)}</pre>
                <p className="term-unit">타/분 · 정확도 {tier.acc}% · Lv.{PROFILE.plays}</p>
              </div>
              <TierLadder tier={tier} />
            </div>
            <p className="sheet-label"># 손가락 지도 — 빨갈수록 자주 틀림</p>
            <KeyHeat />
          </div>
        </div>
        <div className="term sheet vertical split-right">
          {bar('내 능력치')}
          <div className="term-body">
            <p className="term-cmd">
              <b>{SAMPLE.player}@code-race</b> ~ % 내-능력치
            </p>
            <Radar className="rpg-radar split-radar" />
            <p className="split-verdict">
              당신은 <b>{trait}</b> 타입이군요!
            </p>
            <p className="split-desc">
              {desc} · {top.key} {top.value}
            </p>
            <div className="split-skills">
              <p className="sheet-skill">
                <b className="plus">+ 패시브</b> 자동완성 — Tab 한 번에 단어 완성
              </p>
              <p className="sheet-skill">
                <b className="minus">- 디버프</b> 괄호 미아 — <code>{worst[0]}</code> 앞에서 {worst[1]}% 미끄러짐
              </p>
            </div>
            <p className="term-cmd split-prompt">
              <b>{SAMPLE.player}@code-race</b> ~ % <span className="term-caret" />
            </p>
          </div>
        </div>
      </div>
    </Shareable>
  )
}
