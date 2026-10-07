import { typedCount, type Char } from '../typing/engine'
import { useEffect, useState } from 'react'
import { peerColor, type NetStatus, type Peer } from './useRoom'

type Props = {
  name: string
  onNameChange: (name: string) => void
  me: { pos: number; cpm: number; done: number | null }
  peers: Record<string, Peer>
  net: NetStatus
  raceId: string | null
  chars: Char[]
  count: number | null
  canStart: boolean
  finished: boolean
  copied: boolean
  onCopy: () => void
  onStart: () => void
}

export function RacePanel({
  name,
  onNameChange,
  me,
  peers,
  net,
  raceId,
  chars,
  count,
  canStart,
  finished,
  copied,
  onCopy,
  onStart,
}: Props) {
  const total = typedCount(chars, chars.length)
  // 몇 초 지나도 아무도 안 보이면 원인별 안내를 띄움
  const [waited, setWaited] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 8000)
    return () => clearTimeout(t)
  }, [])
  const alone = Object.keys(peers).length === 0
  const players = [
    { id: 'me', name: `${name} (나)`, color: 'var(--accent)', ...me },
    ...Object.entries(peers).map(([id, p]) => ({
      id,
      name: p.name,
      color: peerColor(id),
      pos: raceId && p.race === raceId ? (p.pos ?? 0) : 0,
      cpm: raceId && p.race === raceId ? (p.cpm ?? 0) : 0,
      done: raceId && p.race === raceId ? (p.done ?? null) : null,
    })),
  ].sort((a, b) => (a.done ?? Infinity) - (b.done ?? Infinity) || b.pos - a.pos)

  return (
    <section className="room">
      <div className="room-bar">
        <button onClick={onCopy}>{copied ? '복사했어요' : '초대 링크 복사'}</button>
        <label>
          내 이름 <input value={name} maxLength={12} onChange={(e) => onNameChange(e.target.value)} />
        </label>
        {count !== null ? (
          <span className="count">{count}</span>
        ) : (
          canStart && (
            <button className="primary" onClick={onStart}>
              {finished ? '다음 판' : '시작'} <kbd>Enter</kbd>
            </button>
          )
        )}
      </div>
      <ul className="players">
        {players.map((p, i) => (
          <li key={p.id}>
            <span className="rank">{p.done !== null ? `${i + 1}등` : ''}</span>
            <span className="dot" style={{ background: p.color }} />
            <span className="pname">{p.name}</span>
            <span className="bar">
              <span style={{ width: `${(typedCount(chars, p.pos) / total) * 100}%`, background: p.color }} />
            </span>
            <span className="pcpm">{p.done !== null ? `${(p.done / 1000).toFixed(1)}초` : `${p.cpm}타`}</span>
          </li>
        ))}
      </ul>
      {alone && <p className="dim small">링크를 친구에게 보내면 여기 나타나요.</p>}
      <p className={`net ${waited && alone && (net.relays === 0 || net.p2pFailed) ? 'bad' : ''}`}>
        연결 서버 {net.relays}/{net.total}
        {net.turn && ' · 중계 켬'}
        {net.p2pFailed
          ? ' · 친구를 찾았는데 직접 연결이 막혔어요 (방화벽). 둘 중 한 명이 휴대폰 핫스팟 같은 다른 망으로 바꿔 보세요.'
          : waited && alone && net.relays === 0
            ? ' · 연결 서버에 하나도 못 붙었어요. 회사·학교 망이 막고 있을 수 있어요. 휴대폰 핫스팟이나 집 와이파이로 해 보세요.'
            : ''}
      </p>
    </section>
  )
}
