import { useRef, type CSSProperties } from 'react'
import { toPng } from 'html-to-image'
import {
  DEBUFF,
  KEY_ROWS,
  STAT_LINE,
  TIERS,
  keyMissRate,
  statsOf,
  tierOf,
  topPercent,
  worstChar,
  type Profile,
} from './profile'
import './ResultCard.css'

// 5줄짜리 블록 숫자 — 타수를 터미널 그림처럼 크게
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
const bigNumber = (n: number) =>
  [0, 1, 2, 3, 4].map((r) => [...String(n)].map((d) => DIGITS[d][r]).join(' ')).join('\n')

function radarPoints(values: number[], r: number, c: number) {
  return values
    .map((v, i) => {
      const a = (Math.PI * 2 * i) / values.length - Math.PI / 2
      return `${c + Math.cos(a) * r * (v / 100)},${c + Math.sin(a) * r * (v / 100)}`
    })
    .join(' ')
}

// SVG는 CSS 클래스 색이 이미지 저장 때 빠져서 속성으로 직접 칠함
function Radar({ stats, color }: { stats: { key: string; value: number }[]; color: string }) {
  const C = 110
  const R = 82
  return (
    <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className="rc-radar" aria-label="능력치 육각형">
      {[1, 0.66, 0.33].map((k) => (
        <polygon
          key={k}
          points={radarPoints(
            stats.map(() => 100 * k),
            R,
            C,
          )}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
        />
      ))}
      <polygon
        points={radarPoints(
          stats.map((s) => Math.max(s.value, 4)),
          R,
          C,
        )}
        fill={color}
        fillOpacity={0.4}
        stroke={color}
        strokeWidth={2}
      />
      {stats.map((s, i) => {
        const a = (Math.PI * 2 * i) / stats.length - Math.PI / 2
        return (
          <text
            key={s.key}
            x={C + Math.cos(a) * (R + 18)}
            y={C + Math.sin(a) * (R + 18) + 4}
            textAnchor="middle"
            fill="#c9d1d9"
            fontSize={10}
            fontWeight={700}
            fontFamily="-apple-system, 'Apple SD Gothic Neo', sans-serif"
          >
            {s.key} {s.value}
          </text>
        )
      })}
    </svg>
  )
}

const save = (el: HTMLElement | null, file: string) => {
  if (!el) return
  void toPng(el, { pixelRatio: 2, backgroundColor: '#0f1115' }).then((url) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `code-race-${file}.png`
    a.click()
  })
}

type Props = {
  player: string
  cpm: number
  acc: number
  consistency: number
  assist: boolean
  profile: Profile
}

export function ResultCard({ player, cpm, acc, consistency, assist, profile }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const tier = tierOf(cpm)
  const at = TIERS.indexOf(tier)
  const rate = keyMissRate(profile)
  const maxRate = Math.max(1, ...Object.values(rate))
  const stats = statsOf(profile, { cpm, acc, consistency })
  const top = stats.reduce((a, b) => (b.value > a.value ? b : a))
  const [trait, desc] = STAT_LINE[top.key]
  const worst = worstChar(profile)
  const prompt = (cmd: string) => (
    <p className="term-cmd">
      <b>{player}@code-race</b> ~ % {cmd}
    </p>
  )
  const bar = (title: string) => (
    <div className="term-bar">
      <i />
      <i />
      <i />
      <span>{title}</span>
    </div>
  )

  return (
    <section className="rc">
      <div ref={ref} className="rc-capture" style={{ '--tc': tier.color } as CSSProperties}>
        <div className="term rc-left">
          {bar('내 타자 실력')}
          <div className="term-body">
            {prompt('내-실력')}
            <div className="rc-hero">
              <pre className="rc-number">{bigNumber(cpm)}</pre>
              <p className="rc-unit">
                타/분 · 정확도 {acc}% · Lv.{profile.plays}
              </p>
            </div>
            <p className="rc-tier">{tier.name}</p>
            <p className="rc-rank">
              {cpm}타/분 · 상위 {topPercent(cpm)}%
            </p>
            <ol className="rc-ladder">
              {TIERS.map((t, i) => (
                <li key={t.id} className={i < at ? 'past' : i === at ? 'now' : ''}>
                  {t.short}
                </li>
              ))}
            </ol>
            <p className="rc-label"># 손가락 지도 — 빨갈수록 자주 틀림</p>
            <div className="rc-board">
              {KEY_ROWS.map((row, r) => (
                <div key={r} className="rc-row">
                  {row.map(([k]) => (
                    <span
                      key={k}
                      className="rc-key"
                      style={{ '--heat': `${Math.round((rate[k] / maxRate) * 100)}%` } as CSSProperties}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="term rc-right">
          {bar('내 능력치')}
          <div className="term-body">
            {prompt('내-능력치')}
            <Radar stats={stats} color={tier.color} />
            <p className="rc-verdict">
              당신은 <b>{trait}</b> 타입이군요!
            </p>
            <p className="rc-desc">
              {desc} · {top.key} {top.value}
            </p>
            <div className="rc-skills">
              <p>
                {assist ? (
                  <>
                    <b className="plus">+ 패시브</b> 자동완성 — Tab 한 번에 단어 완성
                  </>
                ) : (
                  <>
                    <b className="plus">+ 패시브</b> 손코딩 — 자동완성 없이 끝까지
                  </>
                )}
              </p>
              <p>
                {worst ? (
                  <>
                    <b className="minus">- 디버프</b> {DEBUFF[worst[0]] ?? '손가락 꼬임'} — <code>{worst[0]}</code>{' '}
                    앞에서 {worst[1]}% 미끄러짐
                  </>
                ) : (
                  <>
                    <b className="minus">- 디버프</b> 아직 없음 — 몇 판 더 치면 약점이 보여요
                  </>
                )}
              </p>
            </div>
            <p className="term-cmd rc-prompt">
              <b>{player}@code-race</b> ~ % <span className="term-caret" />
            </p>
          </div>
        </div>
      </div>
      <div className="rc-actions">
        <button onClick={() => save(ref.current, 'card')}>카드 합쳐서 저장</button>
        <button onClick={() => save(ref.current?.querySelector('.rc-left') as HTMLElement, 'card-left')}>
          왼쪽만 저장
        </button>
        <button onClick={() => save(ref.current?.querySelector('.rc-right') as HTMLElement, 'card-right')}>
          오른쪽만 저장
        </button>
      </div>
    </section>
  )
}
