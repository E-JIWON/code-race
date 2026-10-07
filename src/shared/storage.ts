export const store = {
  get<T>(key: string): T | null {
    try {
      return JSON.parse(localStorage.getItem(`code-race:${key}`) ?? 'null')
    } catch {
      return null
    }
  },
  set(key: string, v: unknown) {
    try {
      localStorage.setItem(`code-race:${key}`, JSON.stringify(v))
    } catch {
      /* 저장 못 해도 게임은 됨 */
    }
  },
}
