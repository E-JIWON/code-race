// 초 단위 속도 그래프 — 누적 평균 타수(실선), 그 초의 원시 타수(점선), 오타(빨간 ×)
const W = 600
const H = 150
const PAD = { l: 34, r: 8, t: 12, b: 20 }

export function ResultGraph({ cpm, raw, err }: { cpm: number[]; raw: number[]; err: number[] }) {
  const max = Math.max(60, ...cpm, ...raw) * 1.1
  const x = (i: number) =>
    PAD.l + (cpm.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i / (cpm.length - 1)) * (W - PAD.l - PAD.r))
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const line = (vs: number[]) => vs.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const ticks = [0, Math.round(max / 2), Math.round(max)]

  return (
    <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="초 단위 타수 그래프">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="grid" />
          <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      <polyline points={line(raw)} className="raw" />
      <polyline points={line(cpm)} className="cpm" />
      {err.map(
        (e, i) =>
          e > 0 && (
            <text key={i} x={x(i)} y={PAD.t + 4} textAnchor="middle" className="err">
              ×
            </text>
          ),
      )}
      <text x={W - PAD.r} y={H - 4} textAnchor="end">
        {cpm.length}초
      </text>
    </svg>
  )
}
