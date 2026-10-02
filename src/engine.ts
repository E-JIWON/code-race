// 소스 파일 → 타자 문제로 바꾸는 순수 로직

export type Lang = 'js' | 'ts' | 'py' | 'go' | 'c'
export type Seg = { text: string; comment: boolean }
export type Line = { no: number | null; segs: Seg[] } // no = 원본 파일 줄 번호 (끼워 넣은 한글 주석은 null)

// 한 줄을 코드/주석 조각으로 나눔. st.block = 줄을 넘어가는 주석(/* */, 파이썬 docstring) 안인지
function splitLine(line: string, lang: Lang, st: { block: boolean }): Seg[] {
  const segs: Seg[] = []
  const push = (text: string, comment: boolean) => {
    if (!text) return
    const last = segs[segs.length - 1]
    if (last?.comment === comment) last.text += text
    else segs.push({ text, comment })
  }

  if (lang === 'py') {
    const t = line.trim()
    if (st.block || t.startsWith('"""') || t.startsWith("'''")) {
      if ((line.match(/"""|'''/g) ?? []).length % 2) st.block = !st.block
      push(line, true)
      return segs
    }
  }

  let i = 0
  let quote = ''
  while (i < line.length) {
    if (st.block) {
      const end = line.indexOf('*/', i)
      const stop = end < 0 ? line.length : end + 2
      push(line.slice(i, stop), true)
      if (end >= 0) st.block = false
      i = stop
      continue
    }
    const ch = line[i]
    if (quote) {
      if (ch === '\\') {
        push(line.slice(i, i + 2), false)
        i += 2
        continue
      }
      if (ch === quote) quote = ''
      push(ch, false)
      i++
      continue
    }
    const two = line.slice(i, i + 2)
    if (lang === 'py' ? ch === '#' : two === '//') {
      push(line.slice(i), true)
      break
    }
    if (lang !== 'py' && two === '/*') {
      st.block = true
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch
    push(ch, false)
    i++
  }
  return segs
}

export type Block = {
  from: number // 1부터, 양끝 포함
  to: number
  lang: Lang
  notes?: { line: number; text: string }[] // 그 줄 위에 한글 주석으로 끼움 (\n이면 여러 줄)
  skip?: { from: number; to: number; text: string }[] // 접고 "… text" 한 줄로 대신함
}

// 원본 주석은 빼고, 한글 해설을 주석으로 끼우고, 공통 들여쓰기 제거
export function buildLines(raw: string, b: Block): Line[] {
  const mark = b.lang === 'py' ? '#' : '//'
  const st = { block: false }
  const rows: { no: number | null; indent: number; text: string; comment: boolean }[] = []

  raw.split('\n').slice(b.from - 1, b.to).forEach((l, i) => {
    const no = b.from + i
    const t = l.replace(/\t/g, '  ').trimEnd()
    const code = splitLine(t, b.lang, st).filter((s) => !s.comment).map((s) => s.text).join('').trim()
    const indent = t.length - t.trimStart().length
    const skip = b.skip?.find((s) => no >= s.from && no <= s.to)
    if (skip) {
      if (no === skip.from) rows.push({ no: null, indent, text: `${mark} … ${skip.text}`, comment: true })
      return
    }
    if (!code) {
      if (!t) rows.push({ no, indent: 0, text: '', comment: false }) // 주석만 있던 줄은 버리고 진짜 빈 줄만 유지
      return
    }
    for (const n of b.notes ?? []) {
      if (n.line !== no) continue
      for (const part of n.text.split('\n')) rows.push({ no: null, indent, text: `${mark} ${part}`, comment: true })
    }
    rows.push({ no, indent, text: code, comment: false })
  })

  // 빈 줄 연속·앞뒤·여는 괄호 바로 뒤 빈 줄 정리
  const kept = rows.filter((r, i) => r.text || (i > 0 && rows[i - 1].text && !rows[i - 1].text.endsWith('{')))
  while (kept.length && !kept[kept.length - 1].text) kept.pop()
  const cut = Math.min(...kept.filter((r) => r.text).map((r) => r.indent))
  return kept.map((r) => ({
    no: r.no,
    segs: r.text ? [{ text: ' '.repeat(r.indent - cut) + r.text, comment: r.comment }] : [],
  }))
}

// typed = 직접 쳐야 하는 글자. 들여쓰기·주석·빈 줄은 자동으로 건너뜀
export type Char = { ch: string; typed: boolean; comment: boolean; line: number }

export function toChars(lines: Line[]): Char[] {
  const perLine = lines.map((l) => l.segs.flatMap((s) => [...s.text].map((ch) => ({ ch, comment: s.comment }))))
  // 줄마다 처음~마지막 코드 글자 범위 (앞뒤 공백·주석 제외)
  const ranges = perLine.map((cs) => {
    const idx = cs.flatMap((c, i) => (!c.comment && c.ch !== ' ' ? [i] : []))
    return idx.length ? [idx[0], idx[idx.length - 1]] : null
  })
  const lastCodeLine = ranges.findLastIndex((r) => r)
  const out: Char[] = []
  perLine.forEach((cs, li) => {
    const r = ranges[li]
    cs.forEach((c, i) => out.push({ ...c, line: li, typed: !!r && !c.comment && i >= r[0] && i <= r[1] }))
    if (li < perLine.length - 1) out.push({ ch: '\n', comment: false, line: li, typed: !!r && li < lastCodeLine })
  })
  return out
}

// 자동완성용: 여는 괄호·따옴표 위치 → 짝이 되는 닫는 위치
const OPEN: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
export function closerOf(chars: Char[]): Map<number, number> {
  const pairs = new Map<number, number>()
  const stack: number[] = []
  let quote = -1
  chars.forEach((c, i) => {
    if (!c.typed) return
    if (quote >= 0) {
      if (c.ch === chars[quote].ch && chars[i - 1].ch !== '\\') {
        pairs.set(quote, i)
        quote = -1
      } else if (c.ch === '\n') quote = -1
      return
    }
    if (c.ch === "'" || c.ch === '"' || c.ch === '`') quote = i
    else if (OPEN[c.ch]) stack.push(i)
    else if (stack.length && OPEN[chars[stack[stack.length - 1]].ch] === c.ch) pairs.set(stack.pop()!, i)
  })
  return pairs
}

// 자동완성용: 커서가 단어 중간이면 그 단어의 [시작, 끝]
const WORD = /[A-Za-z0-9_$]/
export function wordAt(chars: Char[], pos: number): [number, number] | null {
  if (!chars[pos]?.typed || !WORD.test(chars[pos].ch)) return null
  let s = pos
  while (s > 0 && chars[s - 1].typed && WORD.test(chars[s - 1].ch)) s--
  let e = pos
  while (e < chars.length && chars[e].typed && WORD.test(chars[e].ch)) e++
  return [s, e]
}

export const skipAuto = (chars: Char[], pos: number) => {
  while (pos < chars.length && !chars[pos].typed) pos++
  return pos
}

export const typedCount = (chars: Char[], pos: number) => chars.slice(0, pos).filter((c) => c.typed).length

// 분당 타수 (한국식 타수)
export const cpm = (typed: number, ms: number) => (ms > 0 ? Math.round(typed / (ms / 60000)) : 0)
