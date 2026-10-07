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

// 여러 판을 모은 프로필 (결산·유형 카드용 샘플)
export const PROFILE = {
  plays: 37,
  minutes: 52,
  consistency: 81,
  assist: true,
  nightOwl: true, // 밤 11시 이후 판이 절반 넘음
  weakKey: ')',
  weakCount: 6,
  topKey: ';',
  topKeyCount: 412,
  libs: [
    { name: 'zustand', plays: 14 },
    { name: 'TanStack Query', plays: 9 },
    { name: 'React', plays: 6 },
    { name: 'Redux', plays: 4 },
    { name: 'Jotai', plays: 3 },
    { name: '작은 명품 유틸', plays: 1 },
  ],
  runs: [
    { title: 'createStore', cpm: 268, errors: 2 },
    { title: 'useShallow', cpm: 301, errors: 0 },
    { title: 'hashKey', cpm: 244, errors: 3 },
    { title: 'replaceEqualDeep', cpm: 212, errors: 6 },
    { title: 'shallowEqual', cpm: 287, errors: 1 },
    { title: 'combineReducers', cpm: 231, errors: 4 },
  ],
}

// 약한 기호 → 별명 (당근 연말결산식)
export const NICKNAMES: Record<string, [string, string]> = {
  ')': ['괄호 미아', '닫는 괄호를 자꾸 잃어버려요'],
  ';': ['세미콜론 실종자', '문장 끝이 늘 아슬아슬해요'],
  '>': ['화살표 공포증', '=> 앞에서 손이 멈춰요'],
  '{': ['중괄호 망설임', '블록을 열기 전에 한숨부터 쉬어요'],
  '.': ['체이닝 과속', '점을 너무 빨리 찍어요'],
  '\n': ['엔터 신중론자', '줄바꿈 전에 한 번 더 생각해요'],
}

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
