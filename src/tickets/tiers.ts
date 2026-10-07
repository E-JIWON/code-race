// 티켓 시안용 등급·샘플 기록 (경계값은 아직 가정 — 실제 판정 로직 붙일 때 확정)
export type TierId = 'sprout' | 'mid' | 'pro' | 'king'

export type Tier = { id: TierId; name: string; rank: string; cpm: number; acc: number }

export const TIERS: Tier[] = [
  { id: 'sprout', name: '초급 개발자', rank: '하위 30%', cpm: 128, acc: 91 },
  { id: 'mid', name: '중급 개발자', rank: '상위 55%', cpm: 192, acc: 95 },
  { id: 'pro', name: '고수 개발자', rank: '상위 12%', cpm: 268, acc: 98 },
  { id: 'king', name: '킹갓제너럴 개발자', rank: '상위 2%', cpm: 362, acc: 99 },
]

export const SAMPLE = {
  player: '봉칠',
  course: 'zustand · createStore',
  date: '2026.10.07',
  serial: 'No. 0427',
}
