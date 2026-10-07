import { useState } from 'react'
import { AdmitTicket } from './AdmitTicket'
import { HoloCard } from './HoloCard'
import { Lanyard } from './Lanyard'
import { TIERS } from './tiers'
import './tickets.css'

const VARIANTS = [
  { id: 'lanyard', name: 'A. 목걸이 명찰', View: Lanyard },
  { id: 'holo', name: 'B. 홀로 카드', View: HoloCard },
  { id: 'admit', name: 'C. 입장권', View: AdmitTicket },
]

// 티켓 시안 랩 — ?lab 으로 열림
export function TicketLab() {
  const [variant, setVariant] = useState(VARIANTS[0])
  const [tier, setTier] = useState(TIERS[3])
  const { View } = variant

  return (
    <main className="wrap lab">
      <header>
        <h1>티켓 시안</h1>
        <a className="lab-back" href="/">게임으로</a>
      </header>
      <nav className="libs">
        {VARIANTS.map((v) => (
          <button key={v.id} className={v.id === variant.id ? 'on' : ''} onClick={() => setVariant(v)}>
            {v.name}
          </button>
        ))}
      </nav>
      <nav className="fns lab-tiers">
        {TIERS.map((t) => (
          <button key={t.id} className={t.id === tier.id ? 'on' : ''} onClick={() => setTier(t)}>
            {t.name}
          </button>
        ))}
      </nav>
      <View key={variant.id} tier={tier} />
    </main>
  )
}
