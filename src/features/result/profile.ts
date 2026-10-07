// 결과 카드용 기록: 판마다 쌓는 누적 프로필 + 등급·능력치 계산

const MIN_TRIES = 5 // 이보다 적게 친 글자는 오타율 판단 보류

export type TierId = 'sprout' | 'mid' | 'pro' | 'king'
export type Tier = { id: TierId; name: string; min: number; color: string }

export const TIERS: Tier[] = [
  { id: 'sprout', name: '초급 개발자', min: 0, color: '#8de08a' },
  { id: 'mid', name: '중급 개발자', min: 145, color: '#8cc3ff' },
  { id: 'pro', name: '고수 개발자', min: 220, color: '#ffd36b' },
  { id: 'king', name: '킹갓제너럴 개발자', min: 310, color: '#c49bff' },
]
export const tierOf = (cpm: number) => [...TIERS].reverse().find((t) => cpm >= t.min)!

// 코드 타수 분포 가정: 문장 타자 평균 52WPM(대부분 30~60, Dhakal 2018) × 5타 × 0.7(코드는 기호가 많아 느림)
// → 평균 182타, 표준편차 70타의 정규분포로 근사. 실제 플레이 데이터가 쌓이면 바꿀 것.
const MEAN = 182
const SD = 70
function normalCdf(z: number) {
  // Abramowitz–Stegun 근사
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}
export const topPercent = (cpm: number) =>
  Math.max(1, Math.min(99, Math.round((1 - normalCdf((cpm - MEAN) / SD)) * 100)))

export type Profile = {
  plays: number
  nightPlays: number // 밤 10시~새벽 4시에 끝낸 판
  keyTry: Record<string, number>
  keyMiss: Record<string, number>
}
const EMPTY: Profile = { plays: 0, nightPlays: 0, keyTry: {}, keyMiss: {} }
const KEY = 'code-race:profile'

export function loadProfile(): Profile {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return EMPTY
  }
}

export function recordRound(typedChars: string[], misses: Record<string, number>, at = new Date()): Profile {
  const p = loadProfile()
  const keyTry = { ...p.keyTry }
  const keyMiss = { ...p.keyMiss }
  for (const ch of typedChars) if (ch.trim()) keyTry[ch] = (keyTry[ch] ?? 0) + 1
  for (const [ch, n] of Object.entries(misses)) if (ch.trim()) keyMiss[ch] = (keyMiss[ch] ?? 0) + n
  const h = at.getHours()
  const next = { plays: p.plays + 1, nightPlays: p.nightPlays + (h >= 22 || h < 4 ? 1 : 0), keyTry, keyMiss }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 저장 못 해도 이번 카드는 보여줌 */
  }
  return next
}

// 자판 한 칸 = [기본 글자, Shift 글자]
export const KEY_ROWS: [string, string][][] = [
  [
    ['`', '~'],
    ['1', '!'],
    ['2', '@'],
    ['3', '#'],
    ['4', '$'],
    ['5', '%'],
    ['6', '^'],
    ['7', '&'],
    ['8', '*'],
    ['9', '('],
    ['0', ')'],
    ['-', '_'],
    ['=', '+'],
  ],
  [...[...'qwertyuiop'].map((k): [string, string] => [k, k.toUpperCase()]), ['[', '{'], [']', '}'], ['\\', '|']],
  [...[...'asdfghjkl'].map((k): [string, string] => [k, k.toUpperCase()]), [';', ':'], ["'", '"']],
  [...[...'zxcvbnm'].map((k): [string, string] => [k, k.toUpperCase()]), [',', '<'], ['.', '>'], ['/', '?']],
]

// 자판 칸별 오타율(%) — 기본·Shift 글자를 합쳐서
export function keyMissRate(p: Profile) {
  const rate: Record<string, number> = {}
  for (const row of KEY_ROWS) {
    for (const [k, s] of row) {
      const tries = (p.keyTry[k] ?? 0) + (p.keyTry[s] ?? 0)
      const miss = (p.keyMiss[k] ?? 0) + (p.keyMiss[s] ?? 0)
      rate[k] = tries >= MIN_TRIES ? Math.round((miss / tries) * 100) : 0
    }
  }
  return rate
}

export function worstChar(p: Profile): [string, number] | null {
  const scored = Object.entries(p.keyMiss)
    .filter(([ch]) => (p.keyTry[ch] ?? 0) >= MIN_TRIES)
    .map(([ch, m]): [string, number] => [ch, Math.round((m / p.keyTry[ch]) * 100)])
    .sort((a, b) => b[1] - a[1])
  return scored[0] && scored[0][1] > 0 ? scored[0] : null
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
// 정확도는 다들 90%대라 80~100%를 0~100으로 넓혀서 차이가 보이게
const spread = (accPct: number) => clamp((accPct - 80) * 5)

export function statsOf(p: Profile, round: { cpm: number; acc: number; consistency: number }) {
  let symTry = 0
  let symMiss = 0
  for (const [ch, n] of Object.entries(p.keyTry)) {
    if (/[a-z0-9]/i.test(ch)) continue
    symTry += n
    symMiss += p.keyMiss[ch] ?? 0
  }
  return [
    { key: '속도', value: clamp((round.cpm / 400) * 100) },
    { key: '정확', value: spread(round.acc) },
    { key: '리듬', value: clamp(round.consistency) },
    { key: '기호', value: symTry ? spread(100 - (symMiss / symTry) * 100) : 50 },
    { key: '끈기', value: clamp(p.plays * 4) },
    { key: '야행성', value: p.plays ? clamp((p.nightPlays / p.plays) * 100) : 0 },
  ]
}

// 가장 높은 능력치 → 「당신은 ~ 타입이군요!」
export const STAT_LINE: Record<string, [string, string]> = {
  속도: ['손이 빠른', '생각보다 손가락이 먼저 가 있어요'],
  정확: ['정확도가 높은', '한 번 칠 때 제대로 치는 손이에요'],
  리듬: ['리듬이 일정한', '메트로놈처럼 같은 박자로 쳐요'],
  기호: ['기호에 강한', '괄호와 화살표 앞에서도 흔들리지 않아요'],
  끈기: ['끈기가 많은', '긴 함수도 끝까지 붙잡아요'],
  야행성: ['야행성이 강한', '새벽에 손이 제일 잘 풀려요'],
}

export const DEBUFF: Record<string, string> = {
  ')': '괄호 미아',
  '(': '괄호 미아',
  '}': '중괄호 미아',
  '{': '중괄호 미아',
  ']': '대괄호 미아',
  '[': '대괄호 미아',
  ';': '세미콜론 실종',
  '>': '화살표 공포증',
  '=': '등호 망설임',
  "'": '따옴표 실종',
  '"': '따옴표 실종',
  '.': '체이닝 과속',
  ',': '쉼표 실종',
  ':': '콜론 혼동',
  '`': '백틱 미아',
  _: '밑줄 미아',
  '|': '파이프 혼동',
}
