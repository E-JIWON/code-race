// node scripts/engine.check.ts 로 실행
import assert from 'node:assert/strict'
import { codeLines, pickWindow, skipAuto, toChars, typedCount } from '../src/engine.ts'

assert.deepEqual(codeLines('*r ^= 1\n#ifdef X\n/* c */').map((l) => l.text), ['*r ^= 1', '#ifdef X'])
const raw = ['// 주석', 'def f(x):', '    """doc', '    still doc"""', '\treturn x  ', '', '# hi', 'y = 1'].join('\n')
const lines = codeLines(raw)
assert.deepEqual(lines.map((l) => l.text), ['def f(x):', '  return x', 'y = 1'])
assert.deepEqual(lines.map((l) => l.no), [2, 5, 8])

assert.deepEqual(codeLines('a()\n/*\nblock\n*/\nb() /* x */').map((l) => l.text), ['a()', 'b() /* x */'])

assert.equal(pickWindow(lines, 2, () => 0)?.[0].text, 'def f(x):')
assert.equal(pickWindow(lines, 9), null)

const chars = toChars(['a', '  b'])
assert.deepEqual(chars.map((c) => c.ch).join(''), 'a\n  b')
assert.equal(skipAuto(chars, 2), 4) // Enter 뒤 들여쓰기 건너뜀
assert.equal(typedCount(chars, 5), 3) // a, ↵, b
console.log('ok')
