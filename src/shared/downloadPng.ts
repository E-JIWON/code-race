import { toPng } from 'html-to-image'

export function downloadPng(el: HTMLElement, file: string, filter?: (node: HTMLElement) => boolean) {
  void toPng(el, { backgroundColor: '#0f1115', pixelRatio: 2, filter }).then((url) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `code-race-${file}.png`
    a.click()
  })
}
