import { useEffect, useRef, useState } from 'react'
import { SAMPLE, type Tier } from './tiers'
import { useTilt } from './useTilt'

// 시안 A: 줄에 매달린 명찰. 잡아 흔들면 진자처럼 흔들리고, 그냥 클릭하면 뒤집힘
export function Lanyard({ tier }: { tier: Tier }) {
  const swingRef = useRef<HTMLDivElement>(null)
  const tilt = useTilt<HTMLDivElement>(10)
  const [flipped, setFlipped] = useState(false)
  const phys = useRef({ angle: 0.5, vel: 0, dragging: false, moved: false })

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.032)
      last = t
      const p = phys.current
      if (!p.dragging) {
        // 감쇠 진자: 각가속도 = -k·각도 - c·속도
        p.vel += (-22 * Math.sin(p.angle) - 1.6 * p.vel) * dt
        p.angle += p.vel * dt
      }
      const el = swingRef.current
      if (el) {
        el.style.setProperty('--swing', `${p.angle}rad`)
        el.style.setProperty('--twist', `${Math.max(-40, Math.min(40, p.vel * 14))}deg`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    phys.current = { ...phys.current, dragging: true, moved: false, vel: 0 }
  }
  const onMove = (e: React.PointerEvent) => {
    const p = phys.current
    if (!p.dragging || !swingRef.current) return
    const pivot = swingRef.current.getBoundingClientRect()
    const px = pivot.left + pivot.width / 2
    const py = pivot.top
    const next = -Math.atan2(e.clientX - px, e.clientY - py)
    if (Math.abs(next - p.angle) > 0.01) p.moved = true
    p.vel = (next - p.angle) * 30
    p.angle = Math.max(-1.3, Math.min(1.3, next))
  }
  const onUp = () => {
    const p = phys.current
    p.dragging = false
    if (!p.moved) setFlipped((f) => !f)
  }

  return (
    <div className="lanyard-stage">
      <div className="lanyard-hook" />
      <div ref={swingRef} className="lanyard-swing">
        <div className="lanyard-strap"><span>코드 타자 레이스 · 코드 타자 레이스 · 코드 타자 레이스</span></div>
        <div className="lanyard-clip" />
        <div
          ref={tilt}
          className={`badge mat-${tier.id} ${flipped ? 'flipped' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        >
          <div className="badge-face front">
            <div className="foil" />
            <div className="badge-hole" />
            <p className="badge-event">코드 타자 레이스 · 개발자 인증</p>
            <p className="badge-tier">{tier.name}</p>
            <p className="badge-cpm"><b>{tier.cpm}</b>타/분</p>
            <p className="badge-rank">{tier.rank}</p>
            <div className="badge-foot">
              <span>{SAMPLE.player}</span>
              <span>{SAMPLE.serial}</span>
            </div>
            <div className="glare" />
          </div>
          <div className="badge-face back">
            <div className="foil" />
            <div className="badge-hole" />
            <dl>
              <dt>코스</dt><dd>{SAMPLE.course}</dd>
              <dt>정확도</dt><dd>{tier.acc}%</dd>
              <dt>발급일</dt><dd>{SAMPLE.date}</dd>
            </dl>
            <div className="barcode" />
            <p className="badge-serial">{SAMPLE.serial}</p>
          </div>
        </div>
      </div>
      <p className="lab-hint">잡고 흔들어 보세요 · 클릭하면 뒤집혀요</p>
    </div>
  )
}
