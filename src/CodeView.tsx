import type { Char, Line } from './engine'

type Props = {
  lines: Line[]
  chars: Char[]
  pos: number
  wrong: boolean
  ghostPos: number
  peers: { pos: number; color: string }[]
  notedLines: Set<number> // 해설이 있는 원본 줄 번호 (다 친 뒤에만)
  highlight: number | null
  dim: boolean
}

export function CodeView({ lines, chars, pos, wrong, ghostPos, peers, notedLines, highlight, dim }: Props) {
  const peerAt = new Map(peers.map((p) => [p.pos, p.color]))
  const byLine: [Char, number][][] = lines.map(() => [])
  chars.forEach((c, i) => byLine[c.line].push([c, i]))

  return (
    <div className={`code ${dim ? 'fade' : ''}`}>
      {lines.map((line, li) => (
        <div
          key={line.no}
          className={`ln ${notedLines.has(line.no) ? 'noted' : ''} ${highlight === line.no ? 'hl' : ''}`}
        >
          <span className="no">{line.no}</span>
          <span className="tx">
            {byLine[li].map(([c, i]) => {
              const cls = [
                c.comment ? 'cm' : !c.typed ? 'auto' : i < pos ? 'done' : 'todo',
                i === pos && (wrong ? 'cur wrong' : 'cur'),
                i === ghostPos && i > pos && 'ghost',
                c.ch === '\n' && 'nl',
              ].filter(Boolean).join(' ')
              const color = peerAt.get(i)
              return (
                <span key={i} className={cls} style={color ? { boxShadow: `inset 2px 0 ${color}` } : undefined}>
                  {c.ch === '\n' ? (i === pos ? '↵' : c.typed ? ' ' : '') : c.ch}
                </span>
              )
            })}
          </span>
        </div>
      ))}
    </div>
  )
}
