import { useEffect, useReducer, useRef, useState } from 'react'
import { cpm, parseLines, skipAuto, toChars, typedCount, type Char, type Line } from './engine'
import { LANG_LABEL, SNIPPETS, blobUrl, findSnippet, randomSnippet, rawUrl, type Snippet } from './snippets'
import { peerColor, useRoom } from './useRoom'
import { CodeView } from './CodeView'

type Round = { snippet: Snippet; lines: Line[]; chars: Char[] }
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

async function loadRound(snippet: Snippet): Promise<Round> {
  const lines = parseLines(await fetchText(rawUrl(snippet)), snippet.from, snippet.to, snippet.lang)
  return { snippet, lines, chars: toChars(lines) }
}

const store = {
  get<T>(key: string): T | null {
    try { return JSON.parse(localStorage.getItem(`code-race:${key}`) ?? 'null') } catch { return null }
  },
  set(key: string, v: unknown) {
    try { localStorage.setItem(`code-race:${key}`, JSON.stringify(v)) } catch { /* 저장 못 해도 게임은 됨 */ }
  },
}

const NICKS = ['고무오리', '널포인터', '세미콜론', '무한루프', '핫픽스', '레거시', '캐시미스', '스택오버플로']
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type State = {
  round: Round | null
  pos: number
  errors: number
  misses: Record<string, number>
  start: number | null
  end: number | null
  trail: [number, number][] // [pos, 시작 후 ms] — 다음 판의 고스트
  wrong: boolean
  locked: boolean // 대결 대기·카운트다운 중엔 못 침
}
type Action =
  | { type: 'load'; round: Round; locked: boolean }
  | { type: 'go'; at: number }
  | { type: 'key'; ch: string; at: number }

const fresh = (round: Round | null, locked = false): State => ({
  round, pos: round ? skipAuto(round.chars, 0) : 0, errors: 0, misses: {},
  start: null, end: null, trail: [], wrong: false, locked,
})

function reducer(s: State, a: Action): State {
  if (a.type === 'load') return fresh(a.round, a.locked)
  if (a.type === 'go') return { ...s, locked: false, start: a.at }
  if (!s.round || s.locked || s.end !== null) return s
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
  const [hl, setHl] = useState<number | null>(null)

  const [roomId, setRoomId] = useState(() => new URLSearchParams(location.search).get('room'))
  const [name, setName] = useState(() => store.get<string>('name') ?? NICKS[Math.floor(Math.random() * NICKS.length)])
  const [raceId, setRaceId] = useState<string | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const raceToken = useRef('')

  const show = (snippet: Snippet, locked = !!roomId) => {
    setLoading(true)
    setError(false)
    setRaceId(null)
    loadRound(snippet)
      .then((round) => { setBest(store.get(`best:${snippet.id}`)); dispatch({ type: 'load', round, locked }) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }
  const retry = () => s.round && show(s.round.snippet)

  const beginRace = async ({ race, id }: { race: string; id: string }) => {
    const snippet = findSnippet(id)
    if (!snippet) return
    raceToken.current = race
    setRaceId(race)
    let round: Round
    try { round = await loadRound(snippet) } catch { setError(true); return }
    if (raceToken.current !== race) return
    dispatch({ type: 'load', round, locked: true })
    for (let n = 3; n > 0; n--) {
      setCount(n)
      await sleep(1000)
      if (raceToken.current !== race) return
    }
    setCount(null)
    dispatch({ type: 'go', at: performance.now() })
  }

  const room = useRoom(roomId, name, beginRace)

  const canStart = !!roomId && count === null && (s.locked || s.end !== null)
  const startRace = () => {
    if (!s.round) return
    // 방금 끝낸 판이면 새 코드, 대기 중이면 지금 보고 있는 코드로
    const id = s.end !== null ? randomSnippet(s.round.snippet.id).id : s.round.snippet.id
    const start = { race: crypto.randomUUID().slice(0, 8), id }
    room.sendStart(start)
    void beginRace(start)
  }

  const enterRoom = () => {
    const id = crypto.randomUUID().slice(0, 8)
    const url = new URL(location.href)
    url.searchParams.set('room', id)
    history.replaceState(null, '', url)
    setRoomId(id)
    if (s.round) show(s.round.snippet, true)
  }
  const leaveRoom = () => {
    history.replaceState(null, '', location.pathname)
    raceToken.current = ''
    setRoomId(null)
    setCount(null)
    if (s.round) show(s.round.snippet, false)
  }
  const copyLink = () => {
    void navigator.clipboard.writeText(location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  useEffect(() => show(randomSnippet()), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Tab') {
        e.preventDefault()
        if (!roomId || canStart) show(randomSnippet(s.round?.snippet.id))
        return
      }
      if (e.key === 'Escape') { if (!roomId) retry(); return }
      if (canStart && e.key === 'Enter') { e.preventDefault(); startRace(); return }
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

  const chars = s.round?.chars ?? []
  const elapsed = s.start === null ? 0 : (s.end ?? now) - s.start
  const typed = typedCount(chars, s.pos)
  const total = typedCount(chars, chars.length)
  const liveCpm = cpm(typed, elapsed)
  const accuracy = typed + s.errors ? Math.floor((typed / (typed + s.errors)) * 100) : 100
  const finished = s.end !== null

  useEffect(() => {
    if (!finished || !s.round) return
    if (!best || liveCpm > best.cpm) store.set(`best:${s.round.snippet.id}`, { cpm: liveCpm, trail: s.trail })
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!roomId || !raceId || s.start === null) return
    room.sendProgress({ race: raceId, pos: s.pos, cpm: liveCpm, acc: accuracy, done: finished ? elapsed : null })
  }, [s.pos, finished]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => store.set('name', name), [name])

  if (error) {
    return (
      <main className="wrap">
        <p className="dim">코드를 못 불러왔어요. 인터넷 연결을 확인해 주세요.</p>
        <button onClick={() => show(s.round?.snippet ?? randomSnippet())}>다시 시도</button>
      </main>
    )
  }
  if (!s.round) return <main className="wrap"><p className="dim">코드 가져오는 중…</p></main>

  const { snippet, lines } = s.round
  const ghostPos = !roomId && best && s.start !== null ? (best.trail.findLast(([, ms]) => ms <= elapsed)?.[0] ?? -1) : -1
  const weak = Object.entries(s.misses).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const newRecord = finished && (!best || liveCpm > best.cpm)

  const racers = Object.entries(room.peers).filter(([, p]) => raceId && p.race === raceId)
  const players = [
    { id: 'me', name: `${name} (나)`, color: 'var(--accent)', pos: s.pos, cpm: liveCpm, done: finished ? elapsed : null },
    ...Object.entries(room.peers).map(([id, p]) => ({
      id, name: p.name, color: peerColor(id),
      pos: raceId && p.race === raceId ? (p.pos ?? 0) : 0,
      cpm: raceId && p.race === raceId ? (p.cpm ?? 0) : 0,
      done: raceId && p.race === raceId ? (p.done ?? null) : null,
    })),
  ].sort((a, b) => (a.done ?? Infinity) - (b.done ?? Infinity) || b.pos - a.pos)

  return (
    <main className="wrap">
      <header>
        <h1>코드 타자 레이스</h1>
        <div className="head-actions">
          <select
            value={snippet.id}
            disabled={!!roomId && !canStart}
            onChange={(e) => { show(findSnippet(e.target.value)!); e.target.blur() }}
          >
            {SNIPPETS.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
          </select>
          {roomId ? <button onClick={leaveRoom}>혼자 하기</button> : <button onClick={enterRoom}>친구랑 대결</button>}
        </div>
      </header>

      <p className="about">
        <a href={blobUrl(snippet)} target="_blank" rel="noreferrer">{snippet.repo}/{snippet.path}</a>
        <span className="tag">{LANG_LABEL[snippet.lang]}</span>
        <br />
        {snippet.summary}
      </p>

      {roomId && (
        <section className="room">
          <div className="room-bar">
            <button onClick={copyLink}>{copied ? '복사했어요' : '초대 링크 복사'}</button>
            <label>
              내 이름 <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
            </label>
            {count !== null
              ? <span className="count">{count}</span>
              : canStart && <button className="primary" onClick={startRace}>{finished ? '다음 판' : '시작'} <kbd>Enter</kbd></button>}
          </div>
          <ul className="players">
            {players.map((p, i) => (
              <li key={p.id}>
                <span className="rank">{p.done !== null ? `${i + 1}등` : ''}</span>
                <span className="dot" style={{ background: p.color }} />
                <span className="pname">{p.name}</span>
                <span className="bar"><span style={{ width: `${(typedCount(chars, p.pos) / total) * 100}%`, background: p.color }} /></span>
                <span className="pcpm">{p.done !== null ? `${(p.done / 1000).toFixed(1)}초` : `${p.cpm}타`}</span>
              </li>
            ))}
          </ul>
          {Object.keys(room.peers).length === 0 && <p className="dim small">링크를 친구에게 보내면 여기 나타나요.</p>}
        </section>
      )}

      <div className="hud">
        <span><b>{liveCpm}</b> 타/분</span>
        <span><b>{accuracy}</b>% 정확도</span>
        <span><b>{(elapsed / 1000).toFixed(1)}</b>초</span>
        {best && !roomId &&<span className="ghost-label">👻 고스트 {best.cpm} 타/분</span>}
      </div>

      <CodeView
        lines={lines}
        chars={chars}
        pos={s.pos}
        wrong={s.wrong}
        ghostPos={ghostPos}
        peers={racers.map(([id, p]) => ({ pos: p.pos ?? 0, color: peerColor(id) }))}
        notedLines={finished ? new Set(snippet.notes.map((n) => n.line)) : new Set()}
        highlight={hl}
        dim={loading || s.locked}
      />

      {imeWarn && <p className="warn">한글 입력 중이에요. 한/영 키를 눌러 영어로 바꿔 주세요.</p>}

      {finished ? (
        <>
          <section className="result">
            <p className="big">{liveCpm} 타/분 {newRecord && <span className="record">신기록!</span>}</p>
            <p>정확도 {accuracy}% · {(elapsed / 1000).toFixed(1)}초 · 오타 {s.errors}번</p>
            {weak.length > 0 && (
              <p className="weak">약한 기호 {weak.map(([ch, n]) => <code key={ch}>{SHOW[ch] ?? ch} ×{n}</code>)}</p>
            )}
            {!roomId && (
              <div className="actions">
                <button onClick={retry}>고스트랑 다시 <kbd>Esc</kbd></button>
                <button onClick={() => show(randomSnippet(snippet.id))}>다음 코드 <kbd>Tab</kbd></button>
              </div>
            )}
          </section>
          <section className="notes">
            <h2>해설</h2>
            <ul>
              {snippet.notes.map((n) => (
                <li key={n.line} onMouseEnter={() => setHl(n.line)} onMouseLeave={() => setHl(null)}>
                  <span className="lno">{n.line}</span>
                  {n.text}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="dim hint">
          {roomId
            ? s.locked ? '시작을 누르면 모두 같이 3초 뒤 출발해요 · 주석은 안 쳐도 돼요' : '주석·들여쓰기는 자동으로 넘어가요'
            : <>그냥 치면 시작돼요 · 주석·들여쓰기는 자동 · <kbd>Tab</kbd> 다른 코드 · <kbd>Esc</kbd> 처음부터</>}
        </p>
      )}
    </main>
  )
}
