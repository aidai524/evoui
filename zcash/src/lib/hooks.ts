import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  reload: () => void
}

/** Runs fn whenever deps change; stale responses are dropped. Keeps last data while reloading. */
export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const seq = useRef(0)

  useEffect(() => {
    const id = ++seq.current
    setLoading(true)
    setError(undefined)
    fn().then(
      (v) => {
        if (id !== seq.current) return
        setData(v)
        setLoading(false)
      },
      (e: unknown) => {
        if (id !== seq.current) return
        setError(e instanceof Error ? e : new Error(String(e)))
        setLoading(false)
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload }
}

/** Re-render every intervalMs (for countdowns). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Eases from the previous target to the new one (from 0 on mount); jumps straight there under reduced motion. */
export function useTween(target: number, ms = 900): number {
  const [shown, setShown] = useState(() => (reducedMotion() ? target : 0))
  const shownRef = useRef(shown)
  shownRef.current = shown
  useEffect(() => {
    if (reducedMotion() || !Number.isFinite(target)) return setShown(target)
    const from = shownRef.current
    if (from === target) return
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      setShown(from + (target - from) * (1 - (1 - k) ** 3))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return shown
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomHex(bytes = 32): string {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')
}
