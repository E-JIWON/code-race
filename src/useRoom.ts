// 친구랑 대결: 서버 없이 브라우저끼리 직접 연결 (WebRTC, 연결 주선은 공개 nostr 릴레이)
import { useEffect, useRef, useState } from 'react'
import { joinRoom, type MessageAction } from 'trystero'

const APP_ID = 'bongchil-code-race'

export type Progress = { race: string; pos: number; cpm: number; acc: number; done: number | null }
export type Peer = Partial<Progress> & { name: string }
type Start = { race: string; id: string }

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
    const room = joinRoom({ appId: APP_ID }, roomId)
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

    return () => {
      actions.current = {}
      setPeers({})
      void room.leave()
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

// 친구마다 고정 색 (peerId 해시)
const COLORS = ['#ff9f6b', '#6bc7ff', '#ffd36b', '#ff7bc0', '#9be15d', '#c49bff']
export const peerColor = (id: string) => COLORS[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length]
