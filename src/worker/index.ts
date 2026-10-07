import { ROOM_ID } from '../features/race/protocol'

export { Room } from './room'

const INVITE = {
  title: '⚔️ 친구가 코드 타자 대결에 초대했어요',
  description: '링크를 열면 같은 방으로 들어가요. 같은 코드를 동시에 치고 누가 먼저 끝내나 겨뤄요.',
  image: 'og-invite.png',
}

// /ws/:방코드 → 그 방의 Durable Object로, 나머지는 정적 파일(Vite 빌드)
export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url)
    const id = url.pathname.match(/^\/ws\/(.+)$/)?.[1]
    if (id && ROOM_ID.test(id)) return env.ROOM.get(env.ROOM.idFromName(id)).fetch(req)

    const res = await env.ASSETS.fetch(req)
    // 초대 링크를 메신저에 붙이면 초대장 미리보기가 뜨게
    if (url.pathname !== '/' || !url.searchParams.has('room')) return res
    const meta = (selector: string, content: string) =>
      ({ selector, handler: { element: (el: Element) => void el.setAttribute('content', content) } }) as const
    return [
      meta('meta[property="og:title"]', INVITE.title),
      meta('meta[property="og:description"]', INVITE.description),
      meta('meta[property="og:image"]', `${url.origin}/${INVITE.image}`),
      meta('meta[property="og:url"]', url.href),
    ]
      .reduce((rw, m) => rw.on(m.selector, m.handler), new HTMLRewriter())
      .transform(res)
  },
} satisfies ExportedHandler<Env>
