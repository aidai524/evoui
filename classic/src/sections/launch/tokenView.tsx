import { Badge } from '../../components/ui'
import { CONFIG, TAX } from '../../lib/config'
import { spotPrice, curveParams } from '../../lib/curve'
import { bpsToPct, compact, fromAtoms } from '../../lib/format'
import type { CurveStatus, CurveView, TokenInfo } from '../../lib/types'

export const pay = (atoms: bigint | string, frac = 6) => `${fromAtoms(atoms, CONFIG.payment.decimals, frac)} ${CONFIG.payment.symbol}`

export function curveStats(c: CurveView) {
  const p = curveParams(c)
  const sold = BigInt(c.units_sold)
  const price = spotPrice(p, sold)
  const totalUnits = BigInt(c.s) + BigInt(c.reserve_units)
  const mcap = price * totalUnits
  const progress = p.s === 0n ? 0 : Number((sold * 10000n) / p.s) / 10000
  return { price, mcap, sold, progress, totalUnits }
}

/** Display-only: per-unit curve prices are tiny, so show 4 significant digits. */
export function sig(atoms: bigint | string, decimals: number = CONFIG.payment.decimals, digits = 4) {
  const n = Number(BigInt(atoms)) / 10 ** decimals
  if (n === 0) return '0'
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
  const places = Math.min(20, Math.max(0, digits - 1 - Math.floor(Math.log10(n))))
  return n.toFixed(places).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export function TaxBadge() {
  return (
    <Badge tone="lime" title={`${bpsToPct(TAX.totalBps)} transfer tax · ${bpsToPct(TAX.holdersBps)} to holders in ${TAX.rewardSymbol}`}>
      {bpsToPct(TAX.totalBps)} TAX · EARN {TAX.rewardSymbol.toUpperCase()}
    </Badge>
  )
}

export function KindBadge({ token }: { token: TokenInfo }) {
  return token.curve_account ? <Badge tone="accent">CURVE</Badge> : <Badge tone="neutral">TOKEN</Badge>
}

export function StatusBadge({ status }: { status: CurveStatus }) {
  if (status === 'GRADUATED') return <Badge tone="positive">● GRADUATED</Badge>
  if (status === 'SOLD_OUT') return <Badge tone="accent">■ SOLD OUT</Badge>
  return <Badge tone="neutral">▶ TRADING</Badge>
}

export function TokenIcon({ token }: { token: TokenInfo }) {
  return (
    <span className="token-icon" aria-hidden="true">
      {token.icon && /^(https?:|data:image\/)/.test(token.icon) ? <img src={token.icon} alt="" /> : token.symbol.slice(0, 1)}
    </span>
  )
}

export function supplyLabel(t: TokenInfo) {
  return compact(t.total_supply, t.decimals)
}
