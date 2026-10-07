import { useEffect, useRef, useState, type Dispatch } from 'react'
import { store } from '../../shared/storage'
import { loadRound, type Round } from '../course/loadRound'
import { findSnippet, nextSnippet, type Snippet } from '../course/snippets'
import type { Action, TypingState } from '../typing/typingReducer'
import { useRoom } from './useRoom'

const NICKS = ['고무오리', '널포인터', '세미콜론', '무한루프', '핫픽스', '레거시', '캐시미스', '스택오버플로']
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Options = {
  s: TypingState
  dispatch: Dispatch<Action>
  load: (snippet: Snippet, locked: boolean) => void
  onError: () => void
  progress: { cpm: number; acc: number; done: number | null }
}

export function useRace({ s, dispatch, load, onError, progress }: Options) {
  const [roomId, setRoomId] = useState(() => new URLSearchParams(location.search).get('room'))
  const [name, setName] = useState(() => store.get<string>('name') ?? NICKS[Math.floor(Math.random() * NICKS.length)])
  const [raceId, setRaceId] = useState<string | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const raceToken = useRef('')

  // 다른 코드를 띄우면 진행 중이던 대결 표시는 끊음
  const show = (snippet: Snippet, locked = !!roomId) => {
    setRaceId(null)
    load(snippet, locked)
  }

  // raceToken: 카운트다운 중에 새 판이 시작되거나 방을 나가면 이전 판은 멈춤
  const beginRace = async ({ race, id }: { race: string; id: string }) => {
    const snippet = findSnippet(id)
    if (!snippet) return
    raceToken.current = race
    setRaceId(race)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur() // 이름 칸에 남은 포커스가 키를 먹지 않게
    let round: Round
    try {
      round = await loadRound(snippet)
    } catch {
      onError()
      return
    }
    if (raceToken.current !== race) return
    dispatch({ type: 'load', round, locked: true })
    for (let n = 3; n > 0; n--) {
      setCount(n)
      await sleep(1000)
      if (raceToken.current !== race) return
    }
    setCount(null)
    dispatch({ type: 'go', at: performance.now() })
  }

  const room = useRoom(roomId, name, beginRace)

  const canStart = !!roomId && count === null && (s.locked || s.end !== null)
  const startRace = () => {
    if (!s.round) return
    // 방금 끝낸 판이면 코스의 다음 함수, 대기 중이면 지금 보고 있는 코드로
    const id = s.end !== null ? nextSnippet(s.round.snippet.id).id : s.round.snippet.id
    const start = { race: crypto.randomUUID().slice(0, 8), id }
    room.sendStart(start)
    void beginRace(start)
  }

  const enterRoom = () => {
    const id = crypto.randomUUID().slice(0, 8)
    const url = new URL(location.href)
    url.searchParams.set('room', id)
    history.replaceState(null, '', url)
    setRoomId(id)
    if (s.round) show(s.round.snippet, true)
  }
  const leaveRoom = () => {
    history.replaceState(null, '', location.pathname)
    raceToken.current = ''
    setRoomId(null)
    setCount(null)
    if (s.round) show(s.round.snippet, false)
  }
  const copyLink = () => {
    void navigator.clipboard.writeText(location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const finished = progress.done !== null
  useEffect(() => {
    if (!roomId || !raceId || s.start === null) return
    room.sendProgress({ race: raceId, pos: s.pos, ...progress })
  }, [s.pos, finished]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    store.set('name', name)
  }, [name])

  return {
    roomId,
    name,
    setName,
    raceId,
    count,
    copied,
    peers: room.peers,
    net: room.net,
    canStart,
    show,
    startRace,
    enterRoom,
    leaveRoom,
    copyLink,
  }
}
