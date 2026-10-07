import { lazy, Suspense, useState } from 'react'
import { Lineup, NicknameSticker, Receipt, Story, TypeCard } from './Cards'
import { TIERS } from './tiers'
import './tickets.css'

// 3D는 무거워서 그 탭을 열 때만 불러옴
const Badge3D = lazy(() => import('./Badge3D').then((m) => ({ default: m.Badge3D })))

const VARIANTS = [
  { id: 'badge3d', name: '3D 명찰', View: Badge3D },
  { id: 'type', name: '개발자 유형', View: TypeCard },
  { id: 'nickname', name: '별명 스티커', View: NicknameSticker },
  { id: 'receipt', name: '영수증', View: Receipt },
  { id: 'lineup', name: '라인업 포스터', View: Lineup },
  { id: 'story', name: '결산 스토리', View: Story },
]

// 카드 시안 랩 — ?lab 으로 열림 (?lab=receipt 처럼 탭 바로 열기)
export function TicketLab() {
  const [variant, setVariant] = useState(() => VARIANTS.find((v) => v.id === new URLSearchParams(location.search).get('lab')) ?? VARIANTS[0])
  const [tier, setTier] = useState(TIERS[3])
  const { View } = variant

  return (
    <main className="wrap lab">
      <header>
        <h1>카드 시안</h1>
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
      <Suspense fallback={<p className="lab-hint">3D 불러오는 중…</p>}>
        <View key={variant.id} tier={tier} />
      </Suspense>
    </main>
  )
}
