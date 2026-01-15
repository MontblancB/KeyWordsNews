// 간단한 메모리 캐시 (TTL 기반)
interface CacheItem<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map()

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { data, expiresAt })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // 만료된 항목 정리
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new MemoryCache()

// 주기적으로 만료된 캐시 정리 (5분마다)
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}
