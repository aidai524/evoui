import { useCallback, useState } from 'react'
import type { TxResult } from './types'

/** One in-flight write at a time per form; exposes pending verb, last result and error. */
export function useTx<T extends TxResult = TxResult>(onDone?: (r: T) => void) {
  const [pending, setPending] = useState<string | null>(null)
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const run = useCallback(
    async (verb: string, fn: () => Promise<T>) => {
      setPending(verb)
      setError(null)
      setResult(null)
      try {
        const r = await fn()
        setResult(r)
        onDone?.(r)
        return r
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
        return null
      } finally {
        setPending(null)
      }
    },
    [onDone],
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { pending, result, error, run, reset }
}
