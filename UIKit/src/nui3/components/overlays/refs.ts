import type { Ref } from 'react'

/** Writes `node` into a callback or object ref (for merging a forwarded ref with an internal one). */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) (ref as { current: T | null }).current = node
}
