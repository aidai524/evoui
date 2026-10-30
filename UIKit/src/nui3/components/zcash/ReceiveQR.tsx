import qrcode from 'qrcode-generator'
import { useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'

export interface ReceiveQRProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Address or ZIP-321 URI (buildPaymentUri). */
  value: string
  /** Rendered size in px (--nui-qr-size). Default 200. */
  size?: number
  /** Short uppercase caption under the code, e.g. "Unified address". */
  caption?: ReactNode
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
}

function qrPath(value: string, ec: 'L' | 'M' | 'Q' | 'H') {
  const qr = qrcode(0, ec)
  qr.addData(value, 'Byte')
  qr.make()
  const n = qr.getModuleCount()
  let d = ''
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue
      let run = 1
      while (c + run < n && qr.isDark(r, c + run)) run++
      d += `M${c} ${r}h${run}v1h-${run}z`
      c += run - 1
    }
  }
  return { n, d }
}

/** QR on an always-white quiet zone (also in night theme). */
export function ReceiveQR({ value, size = 200, caption, errorCorrection = 'M', className, style, ...rest }: ReceiveQRProps) {
  const { m } = useNuiLocale()
  const { n, d } = useMemo(() => qrPath(value, errorCorrection), [value, errorCorrection])
  return (
    <figure className={cx('nui-qr', className)} style={{ '--nui-qr-size': `${size}px`, ...style } as CSSProperties} {...rest}>
      <svg viewBox={`0 0 ${n} ${n}`} role="img" aria-label={`${m.qrFor} ${value}`} shapeRendering="crispEdges">
        <path d={d} />
      </svg>
      {caption != null && <figcaption className="nui-qr__caption">{caption}</figcaption>}
    </figure>
  )
}
