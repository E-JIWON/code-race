// 결산·유형 카드 시안 5종 (연말결산·MBTI·Receiptify·Instafest·Wrapped 분석)
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import { AXES, NICKNAMES, PROFILE, SAMPLE, TYPE_SUB, TYPE_TITLE, type Tier } from './tiers'
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

// ───── 2. 별명 스티커 (당근 연말결산식) ─────
function scallop(r: number, bumps: number, depth: number) {
  const pts = []
  for (let i = 0; i <= bumps * 8; i++) {
    const a = (i / (bumps * 8)) * Math.PI * 2
    const rr = r - depth * (1 - Math.cos(a * bumps)) / 2
    pts.push(`${150 + rr * Math.cos(a)},${150 + rr * Math.sin(a)}`)
  }
  return `M${pts.join('L')}Z`
}

export function NicknameSticker({ tier }: { tier: Tier }) {
  const [nick, desc] = NICKNAMES[PROFILE.weakKey]
  return (
    <Shareable name="nickname" hint="약한 기호로 별명을 지어줘요 — 6종 중 하나">
      <div className={`sticker mat-${tier.id}`}>
        <svg viewBox="0 0 300 300" aria-hidden>
          <path d={scallop(146, 22, 8)} className="sticker-edge" />
          <circle cx="150" cy="150" r="128" className="sticker-face" />
          <defs><path id="ring" d="M150,150 m-108,0 a108,108 0 1,1 216,0 a108,108 0 1,1 -216,0" /></defs>
          <text className="sticker-ring"><textPath href="#ring">코드 타자 레이스 · 2026 올해의 별명 · 코드 타자 레이스 · 2026 올해의 별명 ·</textPath></text>
        </svg>
        <div className="sticker-body">
          <span className="sticker-key">{PROFILE.weakKey}</span>
          <b>{PROFILE.nightOwl ? '새벽의 ' : ''}{nick}</b>
          <span>{desc}</span>
          <small>{PROFILE.weakKey} 놓친 횟수 {PROFILE.weakCount}번</small>
        </div>
      </div>
    </Shareable>
  )
}

// ───── 3. 영수증 (Receiptify식) ─────
export function Receipt({ tier }: { tier: Tier }) {
  const total = Math.round(PROFILE.runs.reduce((n, r) => n + r.cpm, 0) / PROFILE.runs.length)
  const errs = PROFILE.runs.reduce((n, r) => n + r.errors, 0)
  return (
    <Shareable name="receipt" hint="친 함수가 품목, 타수가 가격이에요">
      <div className="receipt">
        <p className="rc-center rc-store">코드 타자 레이스 마트</p>
        <p className="rc-center">{SAMPLE.date} 23:47 · 손님 {SAMPLE.player}</p>
        <p className="rc-center">주문번호 {SAMPLE.serial.replace('No. ', '')}</p>
        <hr />
        <p className="rc-row rc-head"><span>품목</span><span>타수</span></p>
        {PROFILE.runs.map((r, i) => (
          <div key={r.title}>
            <p className="rc-row"><span>{String(i + 1).padStart(2, '0')} {r.title}</span><span>{r.cpm}</span></p>
            {r.errors > 0 && <p className="rc-row rc-minus"><span>   오타 {r.errors}개</span><span>-{r.errors * 5}</span></p>}
          </div>
        ))}
        <hr />
        <p className="rc-row"><span>품목 수</span><span>{PROFILE.runs.length}</span></p>
        <p className="rc-row"><span>오타 할인</span><span>-{errs * 5}</span></p>
        <p className="rc-row rc-total"><span>평균 타수</span><span>{total}</span></p>
        <p className="rc-row"><span>결제 수단</span><span>열 손가락</span></p>
        <p className="rc-row"><span>등급</span><span>{tier.name}</span></p>
        <hr />
        <div className="barcode" />
        <p className="rc-center">감사합니다 · 또 치러 오세요</p>
      </div>
    </Shareable>
  )
}

// ───── 4. 페스티벌 라인업 포스터 (Instafest식) ─────
export function Lineup({ tier }: { tier: Tier }) {
  const [head, ...rest] = PROFILE.libs
  return (
    <Shareable name="lineup" hint="많이 친 라이브러리일수록 크게 걸려요">
      <div className={`poster p-${tier.id}`}>
        <p className="poster-kicker">{SAMPLE.player}의</p>
        <p className="poster-title">코드 타자<br />페스티벌 2026</p>
        <div className="poster-lineup">
          <p className="pl-head">{head.name}</p>
          <p className="pl-2">{rest.slice(0, 2).map((l) => l.name).join(' · ')}</p>
          <p className="pl-3">{rest.slice(2).map((l) => l.name).join(' · ')}</p>
          <p className="pl-4">{PROFILE.runs.map((r) => r.title).join(' · ')}</p>
        </div>
        <p className="poster-foot">
          <span>{PROFILE.plays}판 · {PROFILE.minutes}분</span>
          <span>{tier.name}</span>
        </p>
      </div>
    </Shareable>
  )
}

// ───── 5. 결산 스토리 (Spotify Wrapped식, 9:16) ─────
export function Story({ tier }: { tier: Tier }) {
  const slides = [
    { kicker: '2026 코드 타자 결산', big: `${PROFILE.plays}판`, text: `${PROFILE.minutes}분 동안 오픈소스를 손으로 읽었어요` },
    { kicker: '가장 많이 친 기호', big: PROFILE.topKey, text: `${PROFILE.topKeyCount}번. 문장을 끝내는 데 진심이에요` },
    { kicker: '제일 오래 붙잡은 라이브러리', big: PROFILE.libs[0].name, text: `${PROFILE.libs[0].plays}판. 이쯤 되면 메인테이너` },
    { kicker: '그래서 당신은', big: tier.name, text: `${tier.cpm}타 · ${tier.rank}` },
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), 3500)
    return () => clearTimeout(t)
  }, [i, slides.length])
  const s = slides[i]
  return (
    <Shareable name={`story-${i + 1}`} hint="오른쪽을 누르면 다음, 왼쪽은 이전 · 지금 보이는 장이 저장돼요">
      <div
        className={`story s-${i}`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setI((n) => (e.clientX - r.left > r.width / 2 ? (n + 1) % slides.length : (n + slides.length - 1) % slides.length))
        }}
      >
        <div className="story-bars">
          {slides.map((_, k) => <span key={k} className={k < i ? 'full' : k === i ? 'run' : ''} />)}
        </div>
        <p className="story-kicker">{s.kicker}</p>
        <p key={i} className={`story-big ${s.big.length > 6 ? 'long' : ''}`}>{s.big}</p>
        <p className="story-text">{s.text}</p>
        <p className="story-foot">코드 타자 레이스 · {SAMPLE.player}</p>
      </div>
    </Shareable>
  )
}
