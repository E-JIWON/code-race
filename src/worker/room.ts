import { DurableObject } from 'cloudflare:workers'
import type { ClientMessage, ServerMessage } from '../features/race/protocol'

const MAX_PLAYERS = 16
const MAX_MESSAGE = 1024 // 정상 메시지는 200바이트 안팎
const MIN_GAP_MS = 20 // 진행 메시지 폭탄 방지. 이름·출발·완주 신호는 버리면 안 돼서 제외

type Attachment = { id: string; name: string; last: number } // name ''은 아직 인사 전

// 방 하나 = Durable Object 하나. 게임 상태는 각자 브라우저에 있고, 서버는 같은 방 사람에게 전달만 함.
// 하이버네이션 웹소켓이라 아무도 안 칠 땐 비용이 안 듦.
export class Room extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 })
    if (this.ctx.getWebSockets().length >= MAX_PLAYERS) return new Response('room full', { status: 429 })

    const [client, server] = Object.values(new WebSocketPair())
    this.ctx.acceptWebSocket(server)
    const me: Attachment = { id: crypto.randomUUID().slice(0, 8), name: '', last: 0 }
    server.serializeAttachment(me)
    // 인사 전 소켓(열리다 바로 닫혀 서버에만 남은 것 등)은 참가자로 안 보여줌
    const peers = this.others(server)
      .map((w) => this.att(w))
      .filter((p) => p.name)
    this.send(server, { t: 'welcome', me: me.id, peers: peers.map(({ id, name }) => ({ id, name })) })
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string' || raw.length > MAX_MESSAGE) return
    const me = this.att(ws)
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }
    if (msg.t === 'prog' && msg.prog?.done == null) {
      const now = Date.now()
      if (now - me.last < MIN_GAP_MS) return
      me.last = now
    }
    if (msg.t === 'hello' && typeof msg.name === 'string') {
      me.name = msg.name.slice(0, 12) || '이름 없음'
      this.broadcast(ws, { t: 'hello', from: me.id, name: me.name })
    } else if (msg.t === 'start' && msg.start) {
      this.broadcast(ws, { t: 'start', from: me.id, start: msg.start })
    } else if (msg.t === 'prog' && msg.prog) {
      this.broadcast(ws, { t: 'prog', from: me.id, prog: msg.prog })
    }
    ws.serializeAttachment(me)
  }

  async webSocketClose(ws: WebSocket) {
    this.broadcast(ws, { t: 'leave', from: this.att(ws).id })
  }

  async webSocketError(ws: WebSocket) {
    await this.webSocketClose(ws)
  }

  private att(ws: WebSocket) {
    return ws.deserializeAttachment() as Attachment
  }

  private others(ws: WebSocket) {
    return this.ctx.getWebSockets().filter((w) => w !== ws && w.readyState === WebSocket.OPEN)
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    ws.send(JSON.stringify(msg))
  }

  private broadcast(from: WebSocket, msg: ServerMessage) {
    const s = JSON.stringify(msg)
    for (const w of this.others(from)) w.send(s)
  }
}
