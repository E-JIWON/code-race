const cache = new Map<string, Promise<string>>()

// 실패한 요청은 캐시에서 빼서 다시 시도할 수 있게
export function fetchText(url: string) {
  if (!cache.has(url)) {
    const p = fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    p.catch(() => cache.delete(url))
    cache.set(url, p)
  }
  return cache.get(url)!
}
