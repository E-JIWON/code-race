import { useState } from 'react'
import { SAMPLE, type Tier } from './tiers'
import { useTilt } from './useTilt'

// 시안 C: 가로 입장권 + 뜯는 꼬리표. 클릭하면 꼬리표가 찢어져 떨어짐
export function AdmitTicket({ tier }: { tier: Tier }) {
  const tilt = useTilt<HTMLDivElement>(12)
  const [torn, setTorn] = useState(false)
  const tear = () => {
    if (torn) return
    setTorn(true)
    setTimeout(() => setTorn(false), 1800)
  }

  return (
    <div className="admit-stage">
      <div ref={tilt} className={`admit mat-${tier.id} ${torn ? 'torn' : ''}`} onClick={tear}>
        <div className="admit-main">
          <div className="foil" />
          <p className="admit-event">코드 타자 레이스 — 입장권</p>
          <p className="admit-tier">{tier.name}</p>
          <div className="admit-stats">
            <span><b>{tier.cpm}</b>타/분</span>
            <span><b>{tier.acc}</b>%</span>
            <span><b>{tier.rank}</b></span>
          </div>
          <p className="admit-meta">{SAMPLE.player} · {SAMPLE.course} · {SAMPLE.date}</p>
          <div className="glare" />
        </div>
        <div className="admit-stub">
          <div className="foil" />
          <p className="admit-admit">입장</p>
          <div className="barcode vertical" />
          <p className="admit-serial">{SAMPLE.serial}</p>
        </div>
      </div>
      <p className="lab-hint">마우스로 기울여 보고 · 클릭하면 꼬리표가 찢어져요</p>
    </div>
  )
}
