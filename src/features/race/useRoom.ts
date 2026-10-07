// 친구랑 대결: 서버 없이 브라우저끼리 직접 연결 (WebRTC, 연결 주선은 공개 nostr 릴레이)
import { useEffect, useRef, useState } from 'react'
import { getRelaySockets, joinRoom, type MessageAction, type Room, type TurnServerConfig } from 'trystero'

const APP_ID = 'bongchil-code-race'
// trystero 기본 릴레이 28곳 중 일부는 죽어서 콘솔 오류만 남김 → 접속을 확인한 곳만 고정 (2026-10-07 확인)
const RELAYS = [
  'wss://nos.lol',
  'wss://relay02.lnfi.network',
  'wss://yabu.me/v2',
  'wss://nostr-relay.corb.net',
  'wss://nostr.islandarea.net',
  'wss://bucket.coracle.social',
]

// 연결 진단: 릴레이에 몇 곳 붙었는지(서로 찾기), 찾았는데 직접 연결이 막혔는지(방화벽)
export type NetStatus = { relays: number; total: number; p2pFailed: boolean; turn: boolean }

export type Progress = { race: string; pos: number; cpm: number; acc: number; done: number | null }
export type Peer = Partial<Progress> & { name: string }
type Start = { race: string; id: string }

// 개발 모드 StrictMode는 effect를 join→leave→join 하는데, trystero leave가 비동기로 릴레이 연결까지 정리해서
// 다시 들어온 방이 조용해짐. 나가기를 잠깐 미루고 그 사이 다시 들어오면 취소해서 같은 방을 이어 씀.
// 회사망처럼 브라우저끼리 직접 연결(UDP)이 막힌 곳을 위한 중계 서버(TURN, Metered 무료).
// 키는 프론트 공개용이라 빌드 변수로 넣음 — 없거나 4초 안에 응답이 없으면 중계 없이 들어감.
const METERED_APP = import.meta.env.VITE_METERED_APP as string | undefined
const METERED_KEY = import.meta.env.VITE_METERED_KEY as string | undefined
let turnRequest: Promise<TurnServerConfig[]> | undefined
function loadTurn(): Promise<TurnServerConfig[]> {
  if (!METERED_APP || !METERED_KEY) return Promise.resolve([])
  turnRequest ??= fetch(`https://${METERED_APP}.metered.live/api/v1/turn/credentials?apiKey=${METERED_KEY}`)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])
  return Promise.race([turnRequest, new Promise<TurnServerConfig[]>((r) => setTimeout(() => r([]), 4000))])
}

type Entry = { room: Room; refs: number; leaveTimer?: ReturnType<typeof setTimeout>; onP2pFail?: () => void }
const rooms = new Map<string, Entry>()
function acquireRoom(id: string, turn: TurnServerConfig[], onP2pFail: () => void) {
  const existing = rooms.get(id)
  if (existing) {
    clearTimeout(existing.leaveTimer)
    existing.refs++
    existing.onP2pFail = onP2pFail
    return existing.room
  }
  const entry = { refs: 1, onP2pFail } as Entry
  entry.room = joinRoom({ appId: APP_ID, relayConfig: { urls: RELAYS }, turnConfig: turn }, id, {
    onJoinError: () => entry.onP2pFail?.(), // 신호는 주고받았는데 WebRTC 연결이 안 됨
  })
  rooms.set(id, entry)
  return entry.room
}
function releaseRoom(id: string) {
  const entry = rooms.get(id)
  if (!entry || --entry.refs > 0) return
  entry.leaveTimer = setTimeout(() => {
    rooms.delete(id)
    void entry.room.leave()
  }, 500)
}

export function useRoom(roomId: string | null, name: string, onStart: (s: Start) => void) {
  const [peers, setPeers] = useState<Record<string, Peer>>({})
  const [net, setNet] = useState<NetStatus>({ relays: 0, total: RELAYS.length, p2pFailed: false, turn: false })
  const actions = useRef<{
    hello?: MessageAction<{ name: string }>
    start?: MessageAction<Start>
    prog?: MessageAction<Progress>
  }>({})
  const nameRef = useRef(name)
  const onStartRef = useRef(onStart)
  useEffect(() => {
    nameRef.current = name
    onStartRef.current = onStart
  })

  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    let disconnect: (() => void) | undefined
    void loadTurn().then((turn) => {
      if (!cancelled) disconnect = connect(roomId, turn)
    })
    return () => {
      cancelled = true
      disconnect?.()
    }
  }, [roomId])

  function connect(roomId: string, turn: TurnServerConfig[]) {
    setNet((n) => ({ ...n, turn: turn.length > 0 }))
    const room = acquireRoom(roomId, turn, () => setNet((n) => ({ ...n, p2pFailed: true })))
    const poll = setInterval(() => {
      const sockets = getRelaySockets() as Record<string, WebSocket>
      const relays = Object.values(sockets).filter((s) => s.readyState === WebSocket.OPEN).length
      setNet((n) => (n.relays === relays ? n : { ...n, relays }))
    }, 1000)
    const hello = room.makeAction<{ name: string }>('hello')
    const start = room.makeAction<Start>('start')
    const prog = room.makeAction<Progress>('prog')
    const upsert = (id: string, patch: Partial<Peer>) =>
      setPeers((p) => ({ ...p, [id]: { ...(p[id] ?? { name: '...' }), ...patch } }))

    hello.onMessage = (d, { peerId }) => upsert(peerId, { name: d.name })
    start.onMessage = (d) => onStartRef.current(d)
    prog.onMessage = (d, { peerId }) => upsert(peerId, d)
    room.onPeerJoin = (peerId) => {
      upsert(peerId, {})
      void hello.send({ name: nameRef.current }, { target: peerId })
    }
    room.onPeerLeave = (peerId) =>
      setPeers((p) => Object.fromEntries(Object.entries(p).filter(([id]) => id !== peerId)))
    actions.current = { hello, start, prog }
    for (const peerId of Object.keys(room.getPeers())) room.onPeerJoin(peerId) // 이어 쓰는 방이면 이미 붙은 친구

    return () => {
      actions.current = {}
      clearInterval(poll)
      setPeers({})
      releaseRoom(roomId)
    }
  }

  useEffect(() => {
    void actions.current.hello?.send({ name })
  }, [name])

  return {
    peers,
    net,
    sendStart: (s: Start) => void actions.current.start?.send(s),
    sendProgress: (p: Progress) => void actions.current.prog?.send(p),
  }
}

const COLORS = ['#ff9f6b', '#6bc7ff', '#ffd36b', '#ff7bc0', '#9be15d', '#c49bff']
export const peerColor = (id: string) => COLORS[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length]
