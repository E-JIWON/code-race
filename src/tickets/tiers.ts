// 카드 시안용 등급·샘플 기록 (경계값·별명은 아직 가정 — 실제 판정 로직 붙일 때 확정)
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

// 여러 판을 모은 프로필 (유형·터미널·RPG 카드용 샘플)
export const PROFILE = {
  plays: 37,
  minutes: 52,
  consistency: 81,
  assist: true,
  weakKey: ')',
  libs: [
    { name: 'zustand', plays: 14 },
    { name: 'TanStack Query', plays: 9 },
    { name: 'React', plays: 6 },
    { name: 'Redux', plays: 4 },
    { name: 'Jotai', plays: 3 },
    { name: '작은 명품 유틸', plays: 1 },
  ],
}

// 키별 오타율(%) — 키보드 지도용
export const KEY_MISS: Record<string, number> = {
  ')': 9, '(': 4, '{': 6, '}': 5, '[': 3, ']': 3, ';': 2, ':': 4, "'": 5, '"': 3, '=': 4, '>': 7, '<': 3,
  '.': 1, ',': 2, '/': 2, '-': 1, '_': 6, '!': 3, '?': 4, '&': 5, '|': 6, '$': 2, '`': 8,
  q: 1, w: 0, e: 1, r: 1, t: 0, y: 1, u: 0, i: 0, o: 1, p: 2,
  a: 0, s: 1, d: 0, f: 0, g: 1, h: 0, j: 0, k: 1, l: 1,
  z: 3, x: 2, c: 0, v: 1, b: 2, n: 0, m: 1,
}

// 최근 20주 하루 판 수 — 타자 잔디용 (샘플: 주말·최근에 더 많이)
export const DAILY = Array.from({ length: 140 }, (_, i) => {
  const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1 // 고정된 가짜 난수 (-1~1)
  const busy = (i > 100 ? 0.35 : 0) + (i % 7 >= 5 ? 0.2 : 0)
  const v = Math.abs(noise) * 0.8 + busy
  return v < 0.4 ? 0 : Math.round((v - 0.3) * 8)
})

// RPG 능력치 (0~100)
export const STATS = [
  { key: '속도', value: 78 },
  { key: '정확', value: 91 },
  { key: '리듬', value: 81 },
  { key: '기호', value: 54 },
  { key: '끈기', value: 66 },
  { key: '야행성', value: 88 },
]

// 개발자 유형 (MBTI식 4축). 앞 두 글자 = 칭호, 뒤 두 글자 = 부제
export const AXES = [
  { left: ['R', '질주'], right: ['C', '신중'], label: '속도 vs 정확' },
  { left: ['S', '꾸준'], right: ['B', '몰아치기'], label: '리듬' },
  { left: ['A', '자동완성파'], right: ['M', '손코딩파'], label: '도구' },
  { left: ['Y', '기호에 약함'], right: ['W', '글자에 약함'], label: '약점' },
] as const
export const TYPE_TITLE: Record<string, string> = {
  RS: '질주하는 기관차', RB: '벼락치기 핫픽서', CS: '정시퇴근 장인', CB: '몰아치는 리뷰어',
}
export const TYPE_SUB: Record<string, string> = {
  AY: '괄호는 IDE에게 맡겨요', AW: 'Tab 키가 제일 닳았어요', MY: '기호와 전쟁 중이에요', MW: '손끝으로 다 쳐요',
}
