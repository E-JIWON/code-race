import { useEffect, useRef } from 'react'

// 포인터 위치 → CSS 변수 (--rx, --ry 기울기 / --mx, --my 빛 위치). 세 시안이 같이 씀
export function useTilt<T extends HTMLElement>(max = 16) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = (x: number, y: number, active: boolean) => {
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`)
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`)
      el.style.setProperty('--mx', `${x * 100}%`)
      el.style.setProperty('--my', `${y * 100}%`)
      el.style.setProperty('--glare', active ? '1' : '0')
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, true)
    }
    const leave = () => set(0.5, 0.5, false)
    leave()
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [max])
  return ref
}
