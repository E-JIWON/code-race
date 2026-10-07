import { SAMPLE, type Tier } from './tiers'
import { useTilt } from './useTilt'

// 시안 B: 트레이딩 카드. 마우스 각도에 따라 홀로 반사가 흐름
export function HoloCard({ tier }: { tier: Tier }) {
  const tilt = useTilt<HTMLDivElement>(22)
  return (
    <div className="holo-stage">
      <div ref={tilt} className={`holo mat-${tier.id}`}>
        <div className="holo-inner">
          <header>
            <span className="holo-tier">{tier.name}</span>
            <span className="holo-hp">{tier.acc}<small>%</small></span>
          </header>
          <div className="holo-art">
            <b>{tier.cpm}</b>
            <span>타/분</span>
          </div>
          <p className="holo-type">{SAMPLE.course}</p>
          <p className="holo-flavor">{tier.rank} — 코드 타자 레이스에서 인증된 손가락</p>
          <footer>
            <span>{SAMPLE.player}</span>
            <span>{SAMPLE.date}</span>
            <span>{SAMPLE.serial}</span>
          </footer>
        </div>
        <div className="foil" />
        <div className="glare" />
      </div>
      <p className="lab-hint">마우스를 카드 위에서 움직여 보세요</p>
    </div>
  )
}
