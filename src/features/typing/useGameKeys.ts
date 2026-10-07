import { useEffect, useState } from 'react'

type Handlers = {
  onTab: () => void
  onEscape: () => void
  onEnter: (() => void) | null // null이면 Enter도 글자(줄바꿈)로 침
  onChar: (ch: string) => void
}

// 매 렌더마다 다시 걸어서 핸들러가 항상 최신 상태를 봄
export function useGameKeys({ onTab, onEscape, onEnter, onChar }: Handlers) {
  const [imeWarn, setImeWarn] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Tab') {
        e.preventDefault()
        onTab()
        return
      }
      if (e.key === 'Escape') {
        onEscape()
        return
      }
      if (onEnter && e.key === 'Enter') {
        e.preventDefault()
        onEnter()
        return
      }
      // 한글 IME 입력 중이면 ASCII 밖 글자나 Process 키가 들어옴
      // oxlint-disable-next-line no-control-regex
      if (e.key === 'Process' || /[^\x00-\x7f]/.test(e.key)) {
        setImeWarn(true)
        return
      }
      const ch = e.key === 'Enter' ? '\n' : e.key
      if (ch.length !== 1) return
      e.preventDefault()
      setImeWarn(false)
      onChar(ch)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return imeWarn
}
