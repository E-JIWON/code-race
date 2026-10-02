// node scripts/engine.check.ts 로 실행
import assert from 'node:assert/strict'
import { parseLines, skipAuto, toChars, typedCount } from '../src/engine.ts'
import { SNIPPETS, rawUrl } from '../src/snippets.ts'

const typedText = (raw: string, lang: Parameters<typeof parseLines>[3]) =>
  toChars(parseLines(raw, 1, raw.split('\n').length, lang))
    .map((c) => (c.typed ? c.ch : c.ch === '\n' ? '~' : '_'))
    .join('')

// 주석·들여쓰기·빈 줄은 자동(_ ~), 코드만 직접 침
assert.equal(typedText('a(); // hi\n\n  b("//x")', 'js'), 'a();______\n~__b("//x")')
assert.equal(typedText('x = 1  # one\n"""doc\nmore"""\ny', 'py'), 'x = 1_______\n______~_______~y')
assert.equal(typedText('for (;;)\n  /* nothing */;', 'c'), 'for (;;)\n_______________;')
assert.equal(typedText("c = '\\''; d", 'c'), "c = '\\''; d")
// 공통 들여쓰기 제거 + 원본 줄 번호 유지
assert.deepEqual(parseLines('\tif x {\n\t\ty\n\t}', 1, 3, 'go').map((l) => [l.no, l.segs[0].text]), [
  [1, 'if x {'], [2, '  y'], [3, '}'],
])

const chars = toChars(parseLines('a\n  b', 1, 2, 'js'))
assert.equal(skipAuto(chars, 2), 4) // Enter 뒤 들여쓰기 건너뜀
assert.equal(typedCount(chars, 5), 3) // a, ↵, b

// --net: 고정 커밋에서 실제로 받아와 노트 줄이 범위 안 코드 줄인지 확인
if (process.argv.includes('--net')) {
  for (const s of SNIPPETS) {
    const lines = parseLines(await (await fetch(rawUrl(s))).text(), s.from, s.to, s.lang)
    const codeLines = new Set(lines.filter((l) => l.segs.some((g) => !g.comment && g.text.trim())).map((l) => l.no))
    for (const n of s.notes) assert.ok(codeLines.has(n.line), `${s.id} 노트 L${n.line}이 코드 줄이 아님`)
    console.log('✓', s.id, lines.length + '줄')
  }
}
console.log('ok')
