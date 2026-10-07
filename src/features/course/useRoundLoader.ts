import { useState, type Dispatch } from 'react'
import { store } from '../../shared/storage'
import type { Action } from '../typing/typingReducer'
import { loadRound } from './loadRound'
import type { Snippet } from './snippets'

export type Best = { cpm: number; trail: [number, number][] }

export function useRoundLoader(dispatch: Dispatch<Action>) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [best, setBest] = useState<Best | null>(null)
  const [requested, setRequested] = useState<Snippet | null>(null) // 실패했을 때 「다시 시도」가 이걸 다시 부름

  const load = (snippet: Snippet, locked: boolean) => {
    setRequested(snippet)
    setLoading(true)
    setError(false)
    loadRound(snippet)
      .then((round) => {
        store.set('last', snippet.id)
        setBest(store.get(`best:${snippet.id}`))
        dispatch({ type: 'load', round, locked })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  return { loading, error, setError, best, load, requested }
}
