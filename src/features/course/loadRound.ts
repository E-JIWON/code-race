import { fetchText } from '../../shared/fetchText'
import { buildLines, closerOf, toChars, type Char, type Line } from '../typing/engine'
import { rawUrl, type Snippet } from './snippets'

export type Round = { snippet: Snippet; lines: Line[]; chars: Char[]; pairs: Map<number, number> }

export async function loadRound(snippet: Snippet): Promise<Round> {
  const lines = buildLines(await fetchText(rawUrl(snippet)), snippet)
  const chars = toChars(lines)
  return { snippet, lines, chars, pairs: closerOf(chars) }
}
