// 소스 파일 → 타자 문제로 바꾸는 순수 로직

export type Source = { repo: string; branch: string; path: string; lang: string }

export const SOURCES: Source[] = [
  { repo: 'facebook/react', branch: 'main', path: 'packages/shared/shallowEqual.js', lang: 'JavaScript' },
  { repo: 'facebook/react', branch: 'main', path: 'packages/react/src/ReactChildren.js', lang: 'JavaScript' },
  { repo: 'vuejs/core', branch: 'main', path: 'packages/reactivity/src/ref.ts', lang: 'TypeScript' },
  { repo: 'sveltejs/svelte', branch: 'main', path: 'packages/svelte/src/store/shared/index.js', lang: 'JavaScript' },
  { repo: 'expressjs/express', branch: 'master', path: 'lib/application.js', lang: 'JavaScript' },
  { repo: 'pmndrs/zustand', branch: 'main', path: 'src/vanilla.ts', lang: 'TypeScript' },
  { repo: 'TanStack/query', branch: 'main', path: 'packages/query-core/src/utils.ts', lang: 'TypeScript' },
  { repo: 'sindresorhus/ky', branch: 'main', path: 'source/core/Ky.ts', lang: 'TypeScript' },
  { repo: 'torvalds/linux', branch: 'master', path: 'lib/sort.c', lang: 'C' },
  { repo: 'torvalds/linux', branch: 'master', path: 'lib/string.c', lang: 'C' },
  { repo: 'golang/go', branch: 'master', path: 'src/sort/sort.go', lang: 'Go' },
  { repo: 'golang/go', branch: 'master', path: 'src/strings/builder.go', lang: 'Go' },
  { repo: 'python/cpython', branch: 'main', path: 'Lib/heapq.py', lang: 'Python' },
  { repo: 'python/cpython', branch: 'main', path: 'Lib/bisect.py', lang: 'Python' },
  { repo: 'rust-lang/rust', branch: 'master', path: 'library/core/src/cmp.rs', lang: 'Rust' },
]

export const rawUrl = (s: Source) => `https://raw.githubusercontent.com/${s.repo}/${s.branch}/${s.path}`
export const blobUrl = (s: Source, line: number) =>
  `https://github.com/${s.repo}/blob/${s.branch}/${s.path}#L${line}`

type Line = { text: string; no: number }

const MAX_WIDTH = 80
const isComment = (t: string) => /^(\/\/|#(\s|!|$)|\/\*.*\*\/$)/.test(t.trim())

// 주석·빈 줄·긴 줄·비ASCII 줄을 뺀 코드 줄만 남김 (원래 줄 번호는 유지)
export function codeLines(raw: string): Line[] {
  const out: Line[] = []
  let inDoc = false // 파이썬 docstring
  let inBlock = false // /* ... */
  raw.split('\n').forEach((line, i) => {
    const quotes = (line.match(/"""|'''/g) ?? []).length
    const wasDoc = inDoc
    if (quotes % 2) inDoc = !inDoc
    if (wasDoc || quotes) return
    if (inBlock) {
      if (line.includes('*/')) inBlock = false
      return
    }
    if (line.lastIndexOf('/*') > line.lastIndexOf('*/')) {
      inBlock = true
      return
    }
    const text = line.replace(/\t/g, '  ').trimEnd()
    if (!text.trim() || isComment(text) || text.length > MAX_WIDTH || /[^\x20-\x7e]/.test(text)) return
    out.push({ text, no: i + 1 })
  })
  return out
}

// 들여쓰기 없는 줄에서 시작하는 연속 n줄을 무작위로 고름
export function pickWindow(lines: Line[], n: number, rand = Math.random): Line[] | null {
  const starts = lines
    .map((_, i) => i)
    .filter((i) => i + n <= lines.length && /^[^\s})\]]/.test(lines[i].text))
  if (!starts.length) return null
  const s = starts[Math.floor(rand() * starts.length)]
  return lines.slice(s, s + n)
}

// 줄 앞 들여쓰기는 auto(자동으로 건너뜀), 줄 끝은 '\n'(Enter)
export type Char = { ch: string; auto: boolean }

export function toChars(lines: string[]): Char[] {
  const chars: Char[] = []
  lines.forEach((line, i) => {
    const indent = line.length - line.trimStart().length
    for (let j = 0; j < line.length; j++) chars.push({ ch: line[j], auto: j < indent })
    if (i < lines.length - 1) chars.push({ ch: '\n', auto: false })
  })
  return chars
}

export const skipAuto = (chars: Char[], pos: number) => {
  while (pos < chars.length && chars[pos].auto) pos++
  return pos
}

export const typedCount = (chars: Char[], pos: number) =>
  chars.slice(0, pos).filter((c) => !c.auto).length

// 분당 타수 (한국식 타수)
export const cpm = (typed: number, ms: number) => (ms > 0 ? Math.round(typed / (ms / 60000)) : 0)
