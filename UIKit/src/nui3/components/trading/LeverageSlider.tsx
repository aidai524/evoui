import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { Slider } from '../forms'

export interface LeverageSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Above this the value turns warning (default 10). */
  warnAbove?: number
  /** Above this the value turns negative (default max / 2). */
  dangerAbove?: number
  marks?: number[]
  label?: ReactNode
  disabled?: boolean
}

export function LeverageSlider({
  value,
  onChange,
  min = 1,
  max = 50,
  step = 1,
  warnAbove = 10,
  dangerAbove,
  marks,
  label,
  disabled,
  className,
  ...rest
}: LeverageSliderProps) {
  const { m, number } = useNuiLocale()
  const labelId = useId()
  const danger = dangerAbove ?? max / 2
  const tone = value > danger ? 'negative' : value > warnAbove ? 'warning' : 'accent'
  const fmt = (v: number) => `${number(v)}×`
  const ticks = marks ?? [min, 5, 10, 25, 50, 100].filter((v, i, a) => v >= min && v <= max && a.indexOf(v) === i)
  if (!ticks.includes(max)) ticks.push(max)
  return (
    <div className={cx('nui-leverage', className)} role="group" aria-labelledby={labelId} {...rest}>
      <div className="nui-leverage__head">
        <span className="nui-leverage__label" id={labelId}>
          {label ?? m.leverage}
        </span>
        <span className={cx('nui-leverage__value', tone !== 'accent' && `nui-leverage__value--${tone}`)} aria-hidden="true">
          {fmt(value)}
        </span>
      </div>
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        marks={ticks}
        format={fmt}
        label={typeof label === 'string' ? label : m.leverage}
        tone={tone}
        disabled={disabled}
      />
    </div>
  )
}
