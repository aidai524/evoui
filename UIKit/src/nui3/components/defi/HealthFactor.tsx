import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export type HealthZone = 'safe' | 'warning' | 'danger'

export function healthZone(value: number, liquidation = 1, warning = 1.5): HealthZone {
  if (value < liquidation) return 'danger'
  if (value < warning) return 'warning'
  return 'safe'
}

export interface HealthFactorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Infinity = no debt. */
  value: number
  liquidation?: number
  warning?: number
  /** Right end of the track. */
  max?: number
  label?: ReactNode
}

const pct = (v: number, max: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`

export function HealthFactor({ value, liquidation = 1, warning = 1.5, max = 3, label, className, style, ...rest }: HealthFactorProps) {
  const { m, number } = useNuiLocale()
  const zone = healthZone(value, liquidation, warning)
  const finite = Number.isFinite(value)
  const shown = finite ? number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '∞'
  const zoneText = zone === 'safe' ? m.zoneSafe : zone === 'warning' ? m.zoneWarning : m.zoneDanger
  return (
    <div
      className={cx('nui-health', className)}
      data-zone={zone}
      role="meter"
      aria-label={typeof label === 'string' ? label : m.healthFactor}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={finite ? Math.min(Math.max(value, 0), max) : max}
      aria-valuetext={`${shown}, ${zoneText}`}
      style={{ '--_liq': pct(liquidation, max), '--_warn': pct(warning, max), ...style } as CSSProperties}
      {...rest}
    >
      <div className="nui-health__row">
        <span className="nui-health__label">{label ?? m.healthFactor}</span>
        <span className="nui-health__value">{shown}</span>
      </div>
      <div className="nui-health__track" aria-hidden="true">
        <span className="nui-health__marker" style={{ left: finite ? pct(value, max) : '100%' }} />
      </div>
    </div>
  )
}
