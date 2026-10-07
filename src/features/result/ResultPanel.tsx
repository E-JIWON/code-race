import { useRef } from 'react'
import { downloadPng } from '../../shared/downloadPng'
import type { Snippet } from '../course/snippets'
import type { TypingState } from '../typing/typingReducer'
import { ResultCard } from './ResultCard'
import { ResultGraph } from './ResultGraph'
import type { Profile } from './profile'
import { consistency, perSecond, rawCpm } from './stats'

const SHOW: Record<string, string> = { '\n': '↵ Enter', ' ': '␣ 스페이스' }

type Props = {
  s: TypingState
  snippet: Snippet
  cpm: number
  accuracy: number
  elapsed: number
  newRecord: boolean
  solo: boolean
  player: string
  assist: boolean
  profile: Profile
  onRetry: () => void
  onNext: () => void
}

export function ResultPanel({
  s,
  snippet,
  cpm,
  accuracy,
  elapsed,
  newRecord,
  solo,
  player,
  assist,
  profile,
  onRetry,
  onNext,
}: Props) {
  const resultRef = useRef<HTMLElement>(null)
  const graph = perSecond(s.keys, elapsed)
  const weak = Object.entries(s.misses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // Monkeytype처럼 결과 화면을 이미지로 (버튼은 빼고 찍음)
  const saveImage = () => {
    if (!resultRef.current) return
    downloadPng(resultRef.current, snippet.id, (n) => !(n instanceof HTMLElement && n.classList.contains('actions')))
  }

  return (
    <>
      <section className="result" ref={resultRef}>
        <p className="big">
          {cpm} 타/분 {newRecord && <span className="record">신기록!</span>}
        </p>
        <p>
          정확도 {accuracy}% · {(elapsed / 1000).toFixed(1)}초 · 오타 {s.errors}번
        </p>
        <p className="sub-stats">
          원시 타수 <b>{rawCpm(s.keys, elapsed)}</b>
          <span>
            일관성 <b>{consistency(graph.raw)}%</b>
          </span>
          <span className="dim">{snippet.title}</span>
        </p>
        <ResultGraph {...graph} />
        <p className="tip">
          <b>그래서 개발할 땐 →</b> {snippet.tip}
        </p>
        {weak.length > 0 && (
          <p className="weak">
            약한 기호{' '}
            {weak.map(([ch, n]) => (
              <code key={ch}>
                {SHOW[ch] ?? ch} ×{n}
              </code>
            ))}
          </p>
        )}
        {solo && (
          <div className="actions">
            <button onClick={onRetry}>
              고스트랑 다시 <kbd>Esc</kbd>
            </button>
            <button onClick={onNext}>
              다음 함수 <kbd>Tab</kbd>
            </button>
            <button className="save" onClick={saveImage}>
              결과 이미지 저장
            </button>
          </div>
        )}
        {!solo && (
          <div className="actions">
            <button className="save" onClick={saveImage}>
              결과 이미지 저장
            </button>
          </div>
        )}
      </section>
      <ResultCard
        player={player}
        cpm={cpm}
        acc={accuracy}
        consistency={consistency(graph.raw)}
        assist={assist}
        profile={profile}
      />
    </>
  )
}
