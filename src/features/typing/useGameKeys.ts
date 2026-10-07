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

  // 마우스로 누른 버튼은 포커스를 풀어, 클릭 직후에도 바로 칠 수 있게 (버튼 포커스는 키보드로 온 경우만 남음)
  useEffect(() => {
    const release = () => {
      if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur()
    }
    window.addEventListener('pointerup', release)
    return () => window.removeEventListener('pointerup', release)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // 키보드 사용자 길: Shift+Tab으로 버튼에 나가고, 버튼 위에선 키를 기본 동작대로, Esc로 게임 복귀
      const focused = document.activeElement
      if (focused instanceof HTMLButtonElement || focused instanceof HTMLAnchorElement) {
        if (e.key === 'Escape') focused.blur()
        return
      }
      if (e.key === 'Tab' && e.shiftKey) return
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
