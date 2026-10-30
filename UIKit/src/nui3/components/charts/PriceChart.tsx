import { useNuiLocale } from '../../i18n'
import { LineChart, type LineChartProps } from './LineChart'

export interface PricePoint {
  /** Timestamp (ms), Date, or a ready-made label. */
  t: number | string | Date
  value: number
}

export interface PriceChartProps extends Omit<LineChartProps, 'series' | 'labels' | 'yFormat'> {
  data: PricePoint[]
  /** Series name in tooltip / summary (default "Price"). */
  name?: string
  color?: string
  /** Area fill (default true). */
  area?: boolean
  /** Price formatter (injected). Default: locale number, 2 decimals. */
  format?: (v: number) => string
  /** Label formatter for `t`. Default: short date (or HH:mm when all points fall on one day). */
  timeFormat?: (t: number | string | Date) => string
  /** Probability series: fixes yMin=0, yMax=1 and formats as percent. */
  probability?: boolean
}

/** `{t, value}` adapter over LineChart for a single price (or probability) series. */
export function PriceChart({ data, name, color, area = true, format, timeFormat, probability, yMin, yMax, label, ...rest }: PriceChartProps) {
  const { m, number, locale } = useNuiLocale()
  const ms = data.map((d) => (typeof d.t === 'string' ? NaN : +d.t))
  const sameDay = ms.length > 1 && Number.isFinite(ms[0]) && Math.abs(ms[ms.length - 1] - ms[0]) < 86_400_000
  const defaultTime = (t: number | string | Date) => {
    if (typeof t === 'string') return t
    const d = new Date(t)
    return sameDay
      ? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
      : d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }
  const tf = timeFormat ?? defaultTime
  const fmt =
    format ??
    (probability
      ? (v: number) => number(v, { style: 'percent', maximumFractionDigits: 0 })
      : (v: number) => number(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  return (
    <LineChart
      series={data.length ? [{ name: name ?? m.price, data: data.map((d) => d.value), color, area }] : []}
      labels={data.map((d) => tf(d.t))}
      yFormat={fmt}
      yMin={probability ? 0 : yMin}
      yMax={probability ? 1 : yMax}
      legend={false}
      label={label}
      {...rest}
    />
  )
}
