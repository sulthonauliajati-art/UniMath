/**
 * SAFE SESSION STORAGE UTILITIES
 *
 * Debounced & try-catch-wrapped sessionStorage helpers.
 * Prevents QuotaExceededError crashes and reduces excessive writes
 * during rapid state changes (e.g., every gameState update in practice).
 */

type DebounceMap = Map<string, ReturnType<typeof setTimeout>>

const debounceTimers: DebounceMap = new Map()

/**
 * Write to sessionStorage with debounce (default 300ms).
 * Only the last value within the window is persisted — prevents
 * hammering sessionStorage on every state update.
 *
 * Wrapped in try-catch to prevent QuotaExceededError crashes.
 */
export function setSafeSessionStorage(
  key: string,
  value: unknown,
  delayMs = 300
): void {
  // Clear any pending write for this key
  const existing = debounceTimers.get(key)
  if (existing) clearTimeout(existing)

  debounceTimers.set(
    key,
    setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value))
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === 'QuotaExceededError' || err.code === 22)
        ) {
          console.warn(
            `[storage] QuotaExceeded for key "${key}" — clearing older entries`
          )
          // Attempt cleanup: remove non-critical keys
          const keysToKeep = ['practiceSession', 'practiceStats']
          const allKeys = Object.keys(sessionStorage)
          for (const k of allKeys) {
            if (!keysToKeep.includes(k)) {
              try {
                sessionStorage.removeItem(k)
              } catch {
                // best effort
              }
            }
          }
          // Retry once after cleanup
          try {
            sessionStorage.setItem(key, JSON.stringify(value))
          } catch {
            console.error(`[storage] Failed to write "${key}" even after cleanup`)
          }
        } else {
          console.error(`[storage] Error writing "${key}":`, err)
        }
      }
      debounceTimers.delete(key)
    }, delayMs)
  )
}

/**
 * Flush all pending debounced writes immediately.
 * Call this before navigation or unmount to ensure data is persisted.
 */
export function flushStorage(): void {
  debounceTimers.forEach((timer) => clearTimeout(timer))
  debounceTimers.clear()
}

/**
 * Read from sessionStorage with try-catch safety.
 * Returns null on any error (missing key, invalid JSON, quota, etc.)
 */
export function getSafeSessionStorage<T = unknown>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Remove from sessionStorage with try-catch safety.
 */
export function removeSafeSessionStorage(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // storage unavailable — ignore
  }
}
