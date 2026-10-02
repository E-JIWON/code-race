import type { Char, Line } from './engine'

type Props = {
  lines: Line[]
  chars: Char[]
  pos: number
  wrong: boolean
  ghostPos: number
  peers: { pos: number; color: string }[]
  dim: boolean
  filled: Set<number> // 자동완성이 미리 채운 닫는 글자
  hint: { word: string; typed: number } | null // 커서 아래 단어 제안
}

export function CodeView({ lines, chars, pos, wrong, ghostPos, peers, dim, filled, hint }: Props) {
  const peerAt = new Map(peers.map((p) => [p.pos, p.color]))
  const byLine: [Char, number][][] = lines.map(() => [])
  chars.forEach((c, i) => byLine[c.line].push([c, i]))

  return (
    <div className={`code ${dim ? 'fade' : ''}`}>
      {lines.map((line, li) => (
        <div key={li} className="ln">
          <span className="no">{line.no ?? ''}</span>
          <span className="tx">
            {/* 주석은 칠 일이 없으니 한 덩어리로 (한글 자간이 자연스럽게) */}
            {line.segs[0]?.comment ? (
              <>
                {line.segs[0].text.match(/^ */)![0]}
                <span className="cm">{line.segs[0].text.trimStart()}</span>
              </>
            ) : byLine[li].map(([c, i]) => {
              const cls = [
                c.comment ? 'cm' : !c.typed ? 'auto' : i < pos ? 'done' : filled.has(i) ? 'filled' : 'todo',
                i === pos && (wrong ? 'cur wrong' : 'cur'),
                i === ghostPos && i > pos && 'ghost',
                c.ch === '\n' && 'nl',
              ].filter(Boolean).join(' ')
              const color = peerAt.get(i)
              return (
                <span key={i} className={cls} style={color ? { boxShadow: `inset 2px 0 ${color}` } : undefined}>
                  {c.ch === '\n' ? (i === pos ? '↵' : c.typed ? ' ' : '') : c.ch}
                  {i === pos && hint && (
                    <span className="hint">
                      <b>{hint.word.slice(0, hint.typed)}</b>{hint.word.slice(hint.typed)}<kbd>Tab</kbd>
                    </span>
                  )}
                </span>
              )
            })}
          </span>
        </div>
      ))}
    </div>
  )
}
