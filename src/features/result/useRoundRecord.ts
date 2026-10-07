import { useEffect, useState } from 'react'
import { store } from '../../shared/storage'
import type { Best } from '../course/useRoundLoader'
import type { TypingState } from '../typing/typingReducer'
import { loadProfile, recordRound, type Profile } from './profile'

// 판이 끝나면 최고 기록(다음 판 고스트)과 결과 카드용 누적 프로필을 저장
export function useRoundRecord(s: TypingState, finished: boolean, cpm: number, best: Best | null) {
  const [profile, setProfile] = useState<Profile>(loadProfile)

  useEffect(() => {
    if (!finished || !s.round) return
    if (!best || cpm > best.cpm) store.set(`best:${s.round.snippet.id}`, { cpm, trail: s.trail })
    // 새 프로필로 다시 그려지면서 함수 칩의 ✓도 바로 반영됨
    setProfile(
      recordRound(
        s.round.chars.filter((c) => c.typed).map((c) => c.ch),
        s.misses,
      ),
    )
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  return profile
}
