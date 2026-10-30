/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined | 0>): string {
  return parts.filter(Boolean).join(' ')
}

/** Stable-ish id prefix for SSR-free client apps; components use React.useId for wiring. */
export function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}
