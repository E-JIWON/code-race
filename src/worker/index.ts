import { ROOM_ID } from '../features/race/protocol'

export { Room } from './room'

// /ws/:방코드 → 그 방의 Durable Object로, 나머지는 정적 파일(Vite 빌드)
export default {
  async fetch(req, env): Promise<Response> {
    const id = new URL(req.url).pathname.match(/^\/ws\/(.+)$/)?.[1]
    if (id && ROOM_ID.test(id)) return env.ROOM.get(env.ROOM.idFromName(id)).fetch(req)
    return env.ASSETS.fetch(req)
  },
} satisfies ExportedHandler<Env>
