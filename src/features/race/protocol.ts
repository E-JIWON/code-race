// 대결 방 웹소켓 메시지 — 브라우저(useRoom)와 방 서버(worker/room)가 같이 씀

export type Progress = { race: string; pos: number; cpm: number; acc: number; done: number | null }
export type Start = { race: string; id: string }

// 브라우저 → 서버
export type ClientMessage = { t: 'hello'; name: string } | { t: 'start'; start: Start } | { t: 'prog'; prog: Progress }

// 서버 → 브라우저
export type ServerMessage =
  | { t: 'welcome'; me: string; peers: { id: string; name: string }[] }
  | { t: 'hello'; from: string; name: string }
  | { t: 'start'; from: string; start: Start }
  | { t: 'prog'; from: string; prog: Progress }
  | { t: 'leave'; from: string }

// 방 코드: 초대 링크의 ?room= 값
export const ROOM_ID = /^[A-Za-z0-9_-]{4,40}$/
