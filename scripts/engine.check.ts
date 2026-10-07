// node scripts/engine.check.ts 로 실행 (--net 붙이면 실제 소스로 문제 전부 검사)
import assert from 'node:assert/strict'
import { buildLines, closerOf, skipAuto, toChars, typedCount, wordAt, type Block } from '../src/engine.ts'
import { LIBRARIES, rawUrl } from '../src/snippets.ts'
import { consistency, perSecond, rawCpm } from '../src/stats.ts'

// 결과 통계: 2초 동안 1초에 5타씩 → 300타/분, 고르면 일관성 100
const g = perSecond([[100, 5, 0], [1500, 5, 1]], 2000)
assert.deepEqual(g.cpm, [300, 300])
assert.deepEqual(g.raw, [300, 360])
assert.deepEqual(g.err, [0, 1])
assert.equal(rawCpm([[100, 5, 0], [1500, 5, 1]], 2000), 330)
assert.equal(consistency([300, 300, 300]), 100)
assert.ok(consistency([100, 500, 100]) < 60)

const render = (raw: string, b: Partial<Block> = {}) =>
  buildLines(raw, { from: 1, to: raw.split('\n').length, lang: 'js', ...b })
    .map((l) => l.segs.map((s) => s.text).join(''))
    .join('\n')

// 원본 주석은 빠지고, 한글 해설이 그 줄 위에 같은 들여쓰기로 들어감
assert.equal(
  render('/**\n * doc\n */\nfunction f() {\n  // old\n  return "//x" // trail\n}', { notes: [{ line: 6, text: '돌려줌' }] }),
  'function f() {\n  // 돌려줌\n  return "//x"\n}',
)
// 접기 + 공통 들여쓰기 제거 + 빈 줄 정리
assert.equal(
  render('\tif (a) {\n\t\tthrow 1\n\t\tthrow 2\n\n\n\t\tb()\n\t}\n', { skip: [{ from: 2, to: 3, text: '검사 (생략)' }] }),
  'if (a) {\n  // … 검사 (생략)\n\n  b()\n}',
)

// 타자: 코드만 직접 치고, 주석·들여쓰기는 건너뜀
const chars = toChars(buildLines('a\n  // x\n  b', { from: 1, to: 3, lang: 'js', notes: [{ line: 3, text: '설명' }] }))
const shape = chars.map((c) => (c.typed ? (c.ch === '\n' ? '↵' : c.ch) : '_')).join('')
assert.equal(shape, 'a↵' + '_'.repeat(10) + 'b') // 들여쓰기2 + '// 설명'5 + ↵ + 들여쓰기2
assert.equal(skipAuto(chars, 2), chars.length - 1)
assert.equal(typedCount(chars, chars.length), 3) // a, ↵, b

// 자동완성: 괄호·따옴표 짝 (문자열 안 괄호는 무시), 커서 아래 단어
const pc = toChars(buildLines("f(a[0], ')', {\n  b: 'x'\n})", { from: 1, to: 3, lang: 'js' }))
const text = pc.map((c) => c.ch).join('')
const pairs = [...closerOf(pc)].map(([o, c]) => text[o] + text[c] + (c - o))
assert.deepEqual(pairs, ['[]2', "''2", "''2", '{}11', '()24'])
assert.deepEqual(wordAt(pc, 0), [0, 1]) // 'f'
assert.equal(wordAt(pc, 1), null) // '('는 단어가 아님

if (process.argv.includes('--net')) {
  for (const lib of LIBRARIES) {
    for (const s of lib.items) {
      const lines = buildLines(await (await fetch(rawUrl(s))).text(), s)
      const nos = new Set(lines.map((l) => l.no))
      for (const n of s.notes) assert.ok(nos.has(n.line), `${s.id} 해설 L${n.line}이 코드 줄이 아님`)
      const text = lines.map((l) => l.segs.map((g) => g.text).join('')).join('\n')
      console.log(`\n── ${lib.name} · ${s.title} (${lines.length}줄)\n${text}`)
    }
  }
}
console.log('ok')
