// 친구랑 대결: 서버 없이 브라우저끼리 직접 연결 (WebRTC, 연결 주선은 공개 nostr 릴레이)
import { useEffect, useRef, useState } from 'react'
import { joinRoom, type MessageAction, type Room } from 'trystero'

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

export type Progress = { race: string; pos: number; cpm: number; acc: number; done: number | null }
export type Peer = Partial<Progress> & { name: string }
type Start = { race: string; id: string }

// 개발 모드 StrictMode는 effect를 join→leave→join 하는데, trystero leave가 비동기로 릴레이 연결까지 정리해서
// 다시 들어온 방이 조용해짐. 나가기를 잠깐 미루고 그 사이 다시 들어오면 취소해서 같은 방을 이어 씀.
const rooms = new Map<string, { room: Room; refs: number; leaveTimer?: ReturnType<typeof setTimeout> }>()
function acquireRoom(id: string) {
  const entry = rooms.get(id)
  if (entry) {
    clearTimeout(entry.leaveTimer)
    entry.refs++
    return entry.room
  }
  const room = joinRoom({ appId: APP_ID, relayConfig: { urls: RELAYS } }, id)
  rooms.set(id, { room, refs: 1 })
  return room
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
    const room = acquireRoom(roomId)
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
      setPeers({})
      releaseRoom(roomId)
    }
  }, [roomId])

  useEffect(() => {
    void actions.current.hello?.send({ name })
  }, [name])

  return {
    peers,
    sendStart: (s: Start) => void actions.current.start?.send(s),
    sendProgress: (p: Progress) => void actions.current.prog?.send(p),
  }
}

const COLORS = ['#ff9f6b', '#6bc7ff', '#ffd36b', '#ff7bc0', '#9be15d', '#c49bff']
export const peerColor = (id: string) => COLORS[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length]
