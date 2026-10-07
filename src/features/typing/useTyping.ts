import { useEffect, useReducer, useState } from 'react'
import { cpm, typedCount } from './engine'
import { suggestion } from './suggestion'
import { freshState, typingReducer } from './typingReducer'

export function useTyping(assist: boolean) {
  const [s, dispatch] = useReducer(typingReducer, null, freshState)
  const [now, setNow] = useState(0)

  // 진행 중일 때만 시계를 돌림 (실시간 타수 + 고스트)
  const running = s.start !== null && s.end === null
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(performance.now()), 50)
    return () => clearInterval(t)
  }, [running])

  const chars = s.round?.chars ?? []
  const typed = typedCount(chars, s.pos)
  const elapsed = s.start === null ? 0 : (s.end ?? now) - s.start
  return {
    s,
    dispatch,
    chars,
    running,
    elapsed,
    finished: s.end !== null,
    hint: assist && !s.locked && s.end === null ? suggestion(chars, s.pos) : null,
    liveCpm: cpm(typed, elapsed),
    accuracy: typed + s.errors ? Math.floor((typed / (typed + s.errors)) * 100) : 100,
  }
}
