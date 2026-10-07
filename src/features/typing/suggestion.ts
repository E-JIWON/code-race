import { wordAt, type Char } from './engine'

const KEYWORDS = new Set(
  'const let var return function typeof export default import from if else for while true false null undefined this new async await interface type extends string number boolean unknown any void throw try catch finally Object Array Math JSON Promise Error'.split(
    ' ',
  ),
)

// 이미 나온 단어나 자주 쓰는 키워드면 제안
export function suggestion(chars: Char[], pos: number) {
  const w = wordAt(chars, pos)
  if (!w || pos - w[0] < 2 || w[1] - pos < 2) return null
  const word = chars
    .slice(w[0], w[1])
    .map((c) => c.ch)
    .join('')
  const seen = chars
    .slice(0, w[0])
    .map((c) => c.ch)
    .join('')
    .split(/[^A-Za-z0-9_$]+/)
  return KEYWORDS.has(word) || seen.includes(word) ? { word, typed: pos - w[0], end: w[1] } : null
}
