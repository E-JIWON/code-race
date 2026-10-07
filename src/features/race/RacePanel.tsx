import { typedCount, type Char } from '../typing/engine'
import { peerColor, type NetStatus, type Peer } from './useRoom'

type Racer = { id: string; name: string; color: string; pos: number; cpm: number; done: number | null }

// 이번 판 기준으로 나 + 친구들을 순위 순서로
export function racersOf(
  me: Omit<Racer, 'id' | 'color' | 'name'> & { name: string },
  peers: Record<string, Peer>,
  raceId: string | null,
): Racer[] {
  return [
    { ...me, id: 'me', name: `${me.name} (나)`, color: 'var(--accent)' },
    ...Object.entries(peers).map(([id, p]) => {
      const inRace = raceId && p.race === raceId
      return {
        id,
        name: p.name,
        color: peerColor(id),
        pos: inRace ? (p.pos ?? 0) : 0,
        cpm: inRace ? (p.cpm ?? 0) : 0,
        done: inRace ? (p.done ?? null) : null,
      }
    }),
  ].sort((a, b) => (a.done ?? Infinity) - (b.done ?? Infinity) || b.pos - a.pos)
}

type LobbyProps = {
  name: string
  onNameChange: (name: string) => void
  alone: boolean
  net: NetStatus
  racing: boolean
  canStart: boolean
  finished: boolean
  copied: boolean
  onCopy: () => void
  onStart: () => void
}

// 대기실: 초대 · 이름 · 시작. 대결 중엔 한 줄로 접힘
export function RacePanel({
  name,
  onNameChange,
  alone,
  net,
  racing,
  canStart,
  finished,
  copied,
  onCopy,
  onStart,
}: LobbyProps) {
  return (
    <section className={`room ${racing ? 'racing' : ''}`}>
      {racing ? (
        <p className="room-racing">⚔️ 대결 중 — 같은 코드를 먼저 끝까지 치면 1등</p>
      ) : (
        <div className="room-bar">
          <button onClick={onCopy}>{copied ? '복사했어요' : '초대 링크 복사'}</button>
          <label>
            내 이름 <input value={name} maxLength={12} onChange={(e) => onNameChange(e.target.value)} />
          </label>
          {canStart && (
            <button className="primary" onClick={onStart}>
              {finished ? '다음 판' : '시작'} <kbd>Enter</kbd>
            </button>
          )}
        </div>
      )}
      {!racing && alone && <p className="dim small">링크를 친구에게 보내면 아래 트랙에 나타나요.</p>}
      <p className={`net ${net.failedTries >= 2 ? 'bad' : ''}`}>
        {net.connected
          ? '방 서버 연결됨'
          : net.failedTries >= 2
            ? '방 서버에 연결이 안 돼요. 다시 시도하는 중… 계속 안 되면 휴대폰 핫스팟 같은 다른 망으로 해 보세요.'
            : '방 서버에 연결하는 중…'}
      </p>
    </section>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']

// 레이스 트랙: 코드 바로 위에 붙어서 따라옴. 각자 말이 결승선으로 달림
export function RaceTrack({ racers, chars }: { racers: Racer[]; chars: Char[] }) {
  const total = Math.max(1, typedCount(chars, chars.length))
  return (
    <ul className="players">
      {racers.map((r, i) => (
        <li key={r.id} className={r.id === 'me' ? 'me' : ''} style={{ '--c': r.color } as React.CSSProperties}>
          <span className="rank">{r.done !== null ? `${MEDAL[i] ?? ''} ${i + 1}등` : ''}</span>
          <span className="pname">{r.name}</span>
          <span className="bar">
            <span style={{ width: `${(typedCount(chars, r.pos) / total) * 100}%`, background: r.color }} />
          </span>
          <span className="pcpm">{r.done !== null ? `${(r.done / 1000).toFixed(1)}초` : `${r.cpm}타`}</span>
        </li>
      ))}
    </ul>
  )
}
