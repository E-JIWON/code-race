import type { Round } from '../course/loadRound'
import type { KeyLog } from '../result/stats'
import { skipAuto } from './engine'

export type TypingState = {
  round: Round | null
  pos: number
  errors: number
  misses: Record<string, number>
  start: number | null
  end: number | null
  trail: [number, number][] // [pos, 시작 후 ms] — 다음 판의 고스트
  wrong: boolean
  locked: boolean // 대결 대기·카운트다운 중엔 못 침
  filled: Set<number> // 자동완성이 채운 닫는 괄호·따옴표
  overtype: string // 방금 자동으로 넘긴 닫는 글자들(순서대로) — 습관적으로 또 쳐도 오타 아님
  keys: KeyLog
}

export type Action =
  | { type: 'load'; round: Round; locked: boolean }
  | { type: 'go'; at: number }
  | { type: 'key'; ch: string; at: number; assist: boolean }
  | { type: 'complete'; to: number; at: number }

export const freshState = (round: Round | null, locked = false): TypingState => ({
  round,
  pos: round ? skipAuto(round.chars, 0) : 0,
  errors: 0,
  misses: {},
  start: null,
  end: null,
  trail: [],
  wrong: false,
  locked,
  filled: new Set(),
  overtype: '',
  keys: [],
})

// from부터 직접 칠 글자까지 커서를 옮김 (들여쓰기·주석·자동완성된 글자는 건너뜀)
function move(s: TypingState, from: number, at: number, filled: Set<number>): TypingState {
  const chars = s.round!.chars
  let pos = from
  let overtype = ''
  while (pos < chars.length && (!chars[pos].typed || filled.has(pos))) {
    if (filled.has(pos)) overtype += chars[pos].ch
    pos++
  }
  const start = s.start ?? at
  let ok = 0
  for (let i = s.pos; i < pos; i++) if (chars[i].typed) ok++
  return {
    ...s,
    pos,
    start,
    filled,
    overtype,
    wrong: false,
    trail: [...s.trail, [pos, at - start]],
    keys: [...s.keys, [at - start, ok, 0]],
    end: pos >= chars.length ? at : null,
  }
}

export function typingReducer(s: TypingState, a: Action): TypingState {
  if (a.type === 'load') return freshState(a.round, a.locked)
  if (a.type === 'go') return { ...s, locked: false, start: a.at }
  if (!s.round || s.locked || s.end !== null) return s
  if (a.type === 'complete') return move(s, a.to, a.at, s.filled)
  const expected = s.round.chars[s.pos].ch
  if (a.ch !== expected) {
    // VS Code처럼 닫는 괄호 덮어쓰기: 건너뛴 글자 중 친 것까지는 봐 줌 (']' 없이 ')'만 쳐도 OK)
    const skip = s.overtype.indexOf(a.ch)
    if (skip >= 0) return { ...s, overtype: s.overtype.slice(skip + 1) }
    return {
      ...s,
      wrong: true,
      errors: s.errors + 1,
      misses: { ...s.misses, [expected]: (s.misses[expected] ?? 0) + 1 },
      keys: [...s.keys, [s.start === null ? 0 : a.at - s.start, 0, 1]],
    }
  }
  const closer = a.assist ? s.round.pairs.get(s.pos) : undefined
  return move(s, s.pos + 1, a.at, closer === undefined ? s.filled : new Set(s.filled).add(closer))
}
