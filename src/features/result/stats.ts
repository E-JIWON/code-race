// Monkeytype식 결과 통계: 초 단위 속도·원시 타수·일관성

export type KeyLog = [ms: number, ok: number, err: number][]

export function perSecond(keys: KeyLog, totalMs: number) {
  const n = Math.max(1, Math.ceil(totalMs / 1000))
  const ok = Array<number>(n).fill(0)
  const err = Array<number>(n).fill(0)
  for (const [ms, o, e] of keys) {
    const i = Math.min(n - 1, Math.floor(ms / 1000))
    ok[i] += o
    err[i] += e
  }
  let sum = 0
  const cpm: number[] = []
  const raw: number[] = []
  for (let i = 0; i < n; i++) {
    // 마지막 초는 다 안 찼을 수 있어서 실제 길이로 나눔
    const secs = i === n - 1 ? Math.max(totalMs / 1000 - i, 0.25) : 1
    sum += ok[i]
    const elapsed = Math.max(Math.min(i + 1, totalMs / 1000), 0.25)
    cpm.push(Math.round((sum / elapsed) * 60)) // 그 초까지의 누적 평균
    raw.push(Math.round(((ok[i] + err[i]) / secs) * 60))
  }
  return { cpm, raw, err }
}

export const rawCpm = (keys: KeyLog, ms: number) =>
  ms > 0 ? Math.round(keys.reduce((n, [, o, e]) => n + o + e, 0) / (ms / 60000)) : 0

// 초당 원시 타수의 변동계수를 0~100으로 (Monkeytype과 같은 공식)
export function consistency(raw: number[]) {
  if (raw.length < 2) return 100
  const mean = raw.reduce((a, b) => a + b, 0) / raw.length
  if (!mean) return 0
  const sd = Math.sqrt(raw.reduce((a, b) => a + (b - mean) ** 2, 0) / raw.length)
  const cv = sd / mean
  return Math.round(100 * (1 - Math.tanh(cv + cv ** 3 / 3 + cv ** 5 / 5)))
}
