import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export type MeterTone = 'accent' | 'positive' | 'warning' | 'negative'

export interface MeterMark {
  value: number
  label?: ReactNode
}

export interface MeterProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label: ReactNode
  tone?: MeterTone
  /** Reference ticks (soft cap, target…) drawn on the track with optional labels below. */
  marks?: MeterMark[]
  /** Right-hand readout; default is the rounded percentage. */
  valueText?: ReactNode
  /** aria-valuetext override (default: the percentage). */
  ariaValueText?: string
}

/** Quota / fundraising / utilisation bar. role="meter". */
export function Meter({ value, max = 100, label, tone = 'accent', marks, valueText, ariaValueText, className, style, ...rest }: MeterProps) {
  const { number } = useNuiLocale()
  const id = useId()
  const safeMax = max > 0 ? max : 1
  const clamp = (v: number) => Math.min(100, Math.max(0, (v / safeMax) * 100))
  const pct = clamp(value)
  const pctText = `${number(Math.round(pct))}%`
  const hasLabels = marks?.some((mk) => mk.label != null)
  return (
    <div
      className={cx('nui-meter', className)}
      data-tone={tone !== 'accent' ? tone : undefined}
      role="meter"
      aria-labelledby={`${id}-l`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={ariaValueText ?? pctText}
      style={{ '--_pct': `${pct}%`, ...style } as CSSProperties}
      {...rest}
    >
      <div className="nui-meter__head">
        <span className="nui-meter__label" id={`${id}-l`}>
          {label}
        </span>
        <span className="nui-meter__value">{valueText ?? pctText}</span>
      </div>
      <div className="nui-meter__track">
        <span className="nui-meter__fill" />
        {marks?.map((mk, i) => (
          <span key={i} className="nui-meter__mark" style={{ left: `${clamp(mk.value)}%` }} />
        ))}
      </div>
      {hasLabels && (
        <div className="nui-meter__marks" aria-hidden="true">
          {marks!.map((mk, i) =>
            mk.label != null ? (
              <span key={i} style={{ left: `${clamp(mk.value)}%` }} data-edge={clamp(mk.value) > 85 ? 'end' : clamp(mk.value) < 15 ? 'start' : undefined}>
                {mk.label}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}
