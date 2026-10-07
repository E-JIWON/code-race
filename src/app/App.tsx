import { useEffect, useState } from 'react'
import { store } from '../shared/storage'
import { CoursePicker } from '../features/course/CoursePicker'
import { ALL, findSnippet, nextSnippet } from '../features/course/snippets'
import { useRoundLoader } from '../features/course/useRoundLoader'
import { RacePanel, RaceTrack, racersOf } from '../features/race/RacePanel'
import { useRace } from '../features/race/useRace'
import { peerColor } from '../features/race/useRoom'
import { ResultPanel } from '../features/result/ResultPanel'
import { useRoundRecord } from '../features/result/useRoundRecord'
import { CodeView } from '../features/typing/CodeView'
import { useGameKeys } from '../features/typing/useGameKeys'
import { useTyping } from '../features/typing/useTyping'

export default function App() {
  const [assist, setAssist] = useState(() => store.get<boolean>('assist') ?? true)
  const { s, dispatch, chars, running, elapsed, finished, hint, liveCpm, accuracy } = useTyping(assist)
  const { loading, error, setError, best, load, requested } = useRoundLoader(dispatch)
  const race = useRace({
    s,
    dispatch,
    load,
    onError: () => setError(true),
    progress: { cpm: liveCpm, acc: accuracy, done: finished ? elapsed : null },
  })
  const { roomId, show, canStart } = race
  const profile = useRoundRecord(s, finished, liveCpm, best)

  const retry = () => s.round && show(s.round.snippet)

  useEffect(() => {
    show(findSnippet(store.get<string>('last') ?? '') ?? ALL[0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const imeWarn = useGameKeys({
    onTab: () => {
      if (hint) dispatch({ type: 'complete', to: hint.end, at: performance.now() })
      else if (s.round && !running && (!roomId || canStart)) show(nextSnippet(s.round.snippet.id))
    },
    onEscape: () => {
      if (!roomId) retry()
    },
    onEnter: canStart ? race.startRace : null,
    onChar: (ch) => dispatch({ type: 'key', ch, at: performance.now(), assist }),
  })

  useEffect(() => {
    store.set('assist', assist)
  }, [assist])

  if (error) {
    return (
      <main className="wrap">
        <p className="dim">코드를 못 불러왔어요. 인터넷 연결을 확인해 주세요.</p>
        <button onClick={() => show(requested ?? s.round?.snippet ?? ALL[0])}>다시 시도</button>
      </main>
    )
  }
  if (!s.round)
    return (
      <main className="wrap">
        <p className="dim">코드 가져오는 중…</p>
      </main>
    )

  const { snippet, lines } = s.round
  const ghostPos =
    !roomId && best && s.start !== null ? (best.trail.findLast(([, ms]) => ms <= elapsed)?.[0] ?? -1) : -1
  const racers = Object.entries(race.peers).filter(([, p]) => race.raceId && p.race === race.raceId)

  return (
    <main className="wrap">
      <header>
        <h1>코드 타자 레이스</h1>
        {roomId ? (
          <button onClick={race.leaveRoom}>혼자 하기</button>
        ) : (
          <button onClick={race.enterRoom}>친구랑 대결</button>
        )}
      </header>

      <CoursePicker snippet={snippet} disabled={!!roomId && !canStart} onPick={(x) => show(x)} />

      {roomId && (
        <RacePanel
          name={race.name}
          onNameChange={race.setName}
          alone={Object.keys(race.peers).length === 0}
          net={race.net}
          racing={race.count !== null || (!!race.raceId && !s.locked && !finished)}
          canStart={canStart}
          finished={finished}
          copied={race.copied}
          onCopy={race.copyLink}
          onStart={race.startRace}
        />
      )}

      <div className="hud">
        <span>
          <b>{liveCpm}</b> 타/분
        </span>
        <span>
          <b>{accuracy}</b>% 정확도
        </span>
        <span>
          <b>{(elapsed / 1000).toFixed(1)}</b>초
        </span>
        {best && !roomId && <span className="ghost-label">👻 고스트 {best.cpm} 타/분</span>}
        <button
          className={`assist ${assist ? 'on' : ''}`}
          onClick={(e) => {
            setAssist(!assist)
            e.currentTarget.blur()
          }}
        >
          자동완성 {assist ? '켬' : '끔'}
        </button>
      </div>

      {/* 트랙은 코드 상자 안에서만 따라붙음 — 결과로 내려가면 같이 사라짐 */}
      <div>
        {roomId && (
          <RaceTrack
            racers={racersOf(
              { name: race.name, pos: s.pos, cpm: liveCpm, done: finished ? elapsed : null },
              race.peers,
              race.raceId,
            )}
            chars={chars}
          />
        )}

        <div className="code-wrap">
          {race.count !== null && (
            <div className="countdown">
              <span key={race.count} className="count">
                {race.count}
              </span>
            </div>
          )}
          <CodeView
            lines={lines}
            chars={chars}
            pos={s.pos}
            wrong={s.wrong}
            ghostPos={ghostPos}
            peers={racers.map(([id, p]) => ({ pos: p.pos ?? 0, color: peerColor(id) }))}
            dim={loading || s.locked}
            filled={s.filled}
            hint={hint}
          />
        </div>
      </div>

      {imeWarn && <p className="warn">한글 입력 중이에요. 한/영 키를 눌러 영어로 바꿔 주세요.</p>}

      {finished ? (
        <ResultPanel
          s={s}
          snippet={snippet}
          cpm={liveCpm}
          accuracy={accuracy}
          elapsed={elapsed}
          newRecord={!best || liveCpm > best.cpm}
          solo={!roomId}
          player={race.name}
          assist={assist}
          profile={profile}
          onRetry={retry}
          onNext={() => show(nextSnippet(snippet.id))}
        />
      ) : (
        <p className="dim hint">
          {roomId ? (
            s.locked ? (
              '시작을 누르면 모두 같이 3초 뒤 출발해요 · 한글 주석은 안 쳐도 돼요'
            ) : (
              '주석·들여쓰기는 자동으로 넘어가요'
            )
          ) : (
            <>
              그냥 치면 시작돼요 · 한글 주석·들여쓰기는 자동 · <kbd>Tab</kbd> 다음 함수 · <kbd>Esc</kbd> 처음부터 ·{' '}
              <kbd>Shift+Tab</kbd> 버튼으로
            </>
          )}
        </p>
      )}
    </main>
  )
}
