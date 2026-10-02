import { useEffect, useReducer, useState } from 'react'
import {
  SOURCES, blobUrl, codeLines, pickWindow, rawUrl, skipAuto, toChars, typedCount, cpm,
  type Char, type Source,
} from './engine'

const LINES = 12

type Round = { id: string; src: Source; startLine: number; chars: Char[] }
type Best = { cpm: number; trail: [number, number][] }

const fileCache = new Map<string, Promise<string>>()
const fetchText = (url: string) => {
  if (!fileCache.has(url)) {
    const p = fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    p.catch(() => fileCache.delete(url))
    fileCache.set(url, p)
  }
  return fileCache.get(url)!
}

async function loadRound(): Promise<Round> {
  for (let tries = 0; tries < 5; tries++) {
    const src = SOURCES[Math.floor(Math.random() * SOURCES.length)]
    const win = pickWindow(codeLines(await fetchText(rawUrl(src))), LINES)
    if (win) {
      return { id: `${src.repo}/${src.path}:${win[0].no}`, src, startLine: win[0].no, chars: toChars(win.map((l) => l.text)) }
    }
  }
  throw new Error('no snippet')
}

const bestKey = (id: string) => `code-race:best:${id}`
const readBest = (id: string): Best | null => {
  try { return JSON.parse(localStorage.getItem(bestKey(id)) ?? 'null') } catch { return null }
}
const saveBest = (id: string, b: Best) => {
  try { localStorage.setItem(bestKey(id), JSON.stringify(b)) } catch { /* 저장 못 해도 게임은 됨 */ }
}

type State = {
  round: Round | null
  pos: number
  errors: number
  misses: Record<string, number>
  start: number | null
  end: number | null
  trail: [number, number][] // [pos, 시작 후 ms] — 다음 판의 고스트
  wrong: boolean
}
type Action = { type: 'load'; round: Round } | { type: 'key'; ch: string; at: number }

const fresh = (round: Round | null): State => ({
  round, pos: round ? skipAuto(round.chars, 0) : 0, errors: 0, misses: {}, start: null, end: null, trail: [], wrong: false,
})

function reducer(s: State, a: Action): State {
  if (a.type === 'load') return fresh(a.round)
  if (!s.round || s.end !== null) return s
  const expected = s.round.chars[s.pos].ch
  if (a.ch !== expected) {
    return { ...s, wrong: true, errors: s.errors + 1, misses: { ...s.misses, [expected]: (s.misses[expected] ?? 0) + 1 } }
  }
  const start = s.start ?? a.at
  const pos = skipAuto(s.round.chars, s.pos + 1)
  return {
    ...s, pos, start, wrong: false,
    trail: [...s.trail, [pos, a.at - start]],
    end: pos >= s.round.chars.length ? a.at : null,
  }
}

const SHOW: Record<string, string> = { '\n': '↵ Enter', ' ': '␣ 스페이스' }

export default function App() {
  const [s, dispatch] = useReducer(reducer, null, fresh)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imeWarn, setImeWarn] = useState(false)
  const [now, setNow] = useState(0)
  const [best, setBest] = useState<Best | null>(null)

  const next = () => {
    setLoading(true)
    setError(false)
    loadRound()
      .then((round) => { setBest(readBest(round.id)); dispatch({ type: 'load', round }) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }
  const retry = () => {
    if (!s.round) return
    setBest(readBest(s.round.id))
    dispatch({ type: 'load', round: s.round })
  }

  useEffect(next, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Tab') { e.preventDefault(); next(); return }
      if (e.key === 'Escape') { retry(); return }
      if (e.key === 'Process' || /[^\x00-\x7f]/.test(e.key)) { setImeWarn(true); return }
      const ch = e.key === 'Enter' ? '\n' : e.key
      if (ch.length !== 1) return
      e.preventDefault()
      setImeWarn(false)
      dispatch({ type: 'key', ch, at: performance.now() })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 진행 중일 때만 시계를 돌림 (실시간 타수 + 고스트)
  const running = s.start !== null && s.end === null
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(performance.now()), 50)
    return () => clearInterval(t)
  }, [running])

  const finished = s.end !== null
  useEffect(() => {
    if (!finished || !s.round || s.start === null || s.end === null) return
    const score = cpm(typedCount(s.round.chars, s.pos), s.end - s.start)
    if (!best || score > best.cpm) saveBest(s.round.id, { cpm: score, trail: s.trail })
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <main className="wrap">
        <p className="dim">코드를 못 불러왔어요. 인터넷 연결을 확인해 주세요.</p>
        <button onClick={next}>다시 시도</button>
      </main>
    )
  }
  if (!s.round) return <main className="wrap"><p className="dim">코드 가져오는 중…</p></main>

  const { chars, src, startLine } = s.round
  const elapsed = s.start === null ? 0 : (s.end ?? now) - s.start
  const typed = typedCount(chars, s.pos)
  const liveCpm = cpm(typed, elapsed)
  const ghostPos = best && s.start !== null ? (best.trail.findLast(([, ms]) => ms <= elapsed)?.[0] ?? -1) : -1
  const accuracy = typed + s.errors ? Math.floor((typed / (typed + s.errors)) * 100) : 100
  const weak = Object.entries(s.misses).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const newRecord = finished && (!best || liveCpm > best.cpm)

  return (
    <main className="wrap">
      <header>
        <h1>코드 타자 레이스</h1>
        <a className="src" href={blobUrl(src, startLine)} target="_blank" rel="noreferrer">
          {src.repo} / {src.path.split('/').pop()} <span className="tag">{src.lang}</span>
        </a>
      </header>

      <div className="hud">
        <span><b>{liveCpm}</b> 타/분</span>
        <span><b>{accuracy}</b>% 정확도</span>
        <span><b>{(elapsed / 1000).toFixed(1)}</b>초</span>
        {best && <span className="ghost-label">👻 고스트 {best.cpm} 타/분</span>}
      </div>

      <pre className={`code ${loading ? 'fade' : ''}`}>
        {chars.map((c, i) => {
          const cls = [
            c.auto ? 'auto' : i < s.pos ? 'done' : 'todo',
            i === s.pos && (s.wrong ? 'cur wrong' : 'cur'),
            i === ghostPos && i > s.pos && 'ghost',
          ].filter(Boolean).join(' ')
          return c.ch === '\n'
            ? <span key={i}><span className={`${cls} nl`}>{i === s.pos ? '↵' : ' '}</span>{'\n'}</span>
            : <span key={i} className={cls}>{c.ch}</span>
        })}
      </pre>

      {imeWarn && <p className="warn">한글 입력 중이에요. 한/영 키를 눌러 영어로 바꿔 주세요.</p>}

      {finished ? (
        <section className="result">
          <p className="big">{liveCpm} 타/분 {newRecord && <span className="record">신기록!</span>}</p>
          <p>정확도 {accuracy}% · {(elapsed / 1000).toFixed(1)}초 · 오타 {s.errors}번</p>
          {weak.length > 0 && (
            <p className="weak">
              약한 기호 {weak.map(([ch, n]) => <code key={ch}>{SHOW[ch] ?? ch} ×{n}</code>)}
            </p>
          )}
          <div className="actions">
            <button onClick={retry}>고스트랑 다시 <kbd>Esc</kbd></button>
            <button onClick={next}>다음 코드 <kbd>Tab</kbd></button>
          </div>
        </section>
      ) : (
        <p className="dim hint">
          그냥 치면 시작돼요 · 들여쓰기는 자동 · <kbd>Tab</kbd> 다른 코드 · <kbd>Esc</kbd> 처음부터
        </p>
      )}
    </main>
  )
}
