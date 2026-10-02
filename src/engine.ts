// 소스 파일 → 타자 문제로 바꾸는 순수 로직

export type Lang = 'js' | 'ts' | 'py' | 'go' | 'c'
export type Seg = { text: string; comment: boolean }
export type Line = { no: number; segs: Seg[] } // no = 원본 파일 줄 번호

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

// from~to 줄(1부터, 양끝 포함)을 잘라 탭→공백, 공통 들여쓰기 제거 후 조각냄
export function parseLines(raw: string, from: number, to: number, lang: Lang): Line[] {
  const texts = raw.split('\n').slice(from - 1, to).map((l) => l.replace(/\t/g, '  ').trimEnd())
  const indents = texts.filter((t) => t).map((t) => t.length - t.trimStart().length)
  const cut = indents.length ? Math.min(...indents) : 0
  const st = { block: false }
  return texts.map((t, i) => ({ no: from + i, segs: splitLine(t.slice(cut), lang, st) }))
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

export const skipAuto = (chars: Char[], pos: number) => {
  while (pos < chars.length && !chars[pos].typed) pos++
  return pos
}

export const typedCount = (chars: Char[], pos: number) => chars.slice(0, pos).filter((c) => c.typed).length

// 분당 타수 (한국식 타수)
export const cpm = (typed: number, ms: number) => (ms > 0 ? Math.round(typed / (ms / 60000)) : 0)
