import { useEffect, useRef, useState, type HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export interface LiveValueProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number
  /** Display formatter; defaults to the locale number format. */
  format?: (n: number) => string
  /** Keep the last direction colour on the text. */
  colored?: boolean
}

/** Flashes its background once (0.9s) when the value changes. Not announced (aria-live off). */
export function LiveValue({ value, format, colored, className, ...rest }: LiveValueProps) {
  const { number } = useNuiLocale()
  const prev = useRef(value)
  const [tick, setTick] = useState<{ n: number; dir?: 'up' | 'down' }>({ n: 0 })
  useEffect(() => {
    if (value !== prev.current) {
      const dir = value > prev.current ? 'up' : 'down'
      prev.current = value
      setTick((t) => ({ n: t.n + 1, dir }))
    }
  }, [value])
  return (
    <span
      key={tick.n}
      className={cx('nui-live', className)}
      data-flash={tick.n > 0 ? tick.dir : undefined}
      data-dir={colored ? tick.dir : undefined}
      aria-live="off"
      {...rest}
    >
      {format ? format(value) : number(value)}
    </span>
  )
}
