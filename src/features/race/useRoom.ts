// 친구랑 대결: 같은 주소의 방 서버(Cloudflare Durable Object)에 웹소켓으로 붙어 메시지를 주고받음.
// 일반 웹사이트와 같은 https(443) 길이라 회사·학교 망에서도 대부분 통함.
import { useEffect, useRef, useState } from 'react'
import type { ClientMessage, Progress, ServerMessage, Start } from './protocol'

export type { Progress } from './protocol'
export type Peer = Partial<Progress> & { name: string }
export type NetStatus = { connected: boolean; failedTries: number }

const roomUrl = (id: string) => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/${id}`

export function useRoom(roomId: string | null, name: string, onStart: (s: Start) => void) {
  const [peers, setPeers] = useState<Record<string, Peer>>({})
  const [net, setNet] = useState<NetStatus>({ connected: false, failedTries: 0 })
  const ws = useRef<WebSocket | null>(null)
  const nameRef = useRef(name)
  const onStartRef = useRef(onStart)
  useEffect(() => {
    nameRef.current = name
    onStartRef.current = onStart
  })

  const send = (msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg))
  }

  useEffect(() => {
    if (!roomId) return
    let socket: WebSocket
    let retry = 0
    let timer: ReturnType<typeof setTimeout>
    let disposed = false
    const upsert = (id: string, patch: Partial<Peer>) =>
      setPeers((p) => ({ ...p, [id]: { ...(p[id] ?? { name: '...' }), ...patch } }))

    const onMessage = (m: ServerMessage) => {
      if (m.t === 'welcome') setPeers(Object.fromEntries(m.peers.map((p) => [p.id, { name: p.name }])))
      else if (m.t === 'hello') upsert(m.from, { name: m.name })
      else if (m.t === 'start') onStartRef.current(m.start)
      else if (m.t === 'prog') upsert(m.from, m.prog)
      else if (m.t === 'leave') setPeers((p) => Object.fromEntries(Object.entries(p).filter(([id]) => id !== m.from)))
    }

    const connect = () => {
      socket = new WebSocket(roomUrl(roomId))
      ws.current = socket
      socket.onopen = () => {
        retry = 0
        setNet({ connected: true, failedTries: 0 })
        send({ t: 'hello', name: nameRef.current })
      }
      // StrictMode·방 이동으로 닫힌 옛 소켓의 이벤트가 늦게 올 수 있어서 지금 소켓 것만 받음
      socket.onmessage = (ev) => {
        if (ws.current === socket) onMessage(JSON.parse(ev.data))
      }
      socket.onclose = () => {
        if (ws.current !== socket) return
        setPeers({})
        setNet((n) => ({ connected: false, failedTries: n.failedTries + 1 }))
        if (!disposed) timer = setTimeout(connect, Math.min(8000, 500 * 2 ** retry++))
      }
    }
    // 한 박자 미뤄 엶: StrictMode가 열자마자 닫으면 브라우저가 닫힘을 안 알려 서버에 유령 참가자가 남음
    timer = setTimeout(connect, 0)

    return () => {
      disposed = true
      clearTimeout(timer)
      ws.current = null
      socket?.close()
      setPeers({})
      setNet({ connected: false, failedTries: 0 })
    }
  }, [roomId])

  useEffect(() => {
    send({ t: 'hello', name })
  }, [name])

  return {
    peers,
    net,
    sendStart: (start: Start) => send({ t: 'start', start }),
    sendProgress: (prog: Progress) => send({ t: 'prog', prog }),
  }
}

const COLORS = ['#ff9f6b', '#6bc7ff', '#ffd36b', '#ff7bc0', '#9be15d', '#c49bff']
export const peerColor = (id: string) => COLORS[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length]
