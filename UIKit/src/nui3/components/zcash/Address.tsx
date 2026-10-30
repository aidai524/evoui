import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { ADDRESS_KIND_LABEL, parseAddress, truncateMiddle, type AddressKind } from '../../utils/address'
import { cx } from '../../utils/cx'
import { CopyButton } from './copy'

export type Truncate = [head: number, tail: number] | false

function TruncText({ value, truncate, href, className }: { value: string; truncate: Truncate; href?: string; className: string }) {
  const shown = truncate ? truncateMiddle(value, truncate[0], truncate[1]) : value
  const inner = (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="nui-sr-only">{value}</span>
    </>
  )
  return href ? (
    <a className={className} href={href} title={value} data-truncated={shown !== value || undefined}>
      {inner}
    </a>
  ) : (
    <span className={className} title={value} tabIndex={0} data-truncated={shown !== value || undefined}>
      {inner}
    </span>
  )
}

export interface AddressProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  address: string
  /** Middle truncation [head, tail]; false shows the whole value. Default [8, 6]. */
  truncate?: Truncate
  copyable?: boolean
  /** Show the Unified / Sapling / Transparent / TEX label (derived via parseAddress). */
  showKind?: boolean
  href?: string
  /** Full value, wrapping allowed (detail / receive pages). */
  full?: boolean
}

/** Zcash address: kind label + middle truncation + copy (copy always copies the full value). */
export function Address({ address, truncate = [8, 6], copyable = true, showKind = true, href, full, className, ...rest }: AddressProps) {
  const { m } = useNuiLocale()
  const kind: AddressKind | undefined = parseAddress(address)?.kind
  const kindLabel = kind === 'transparent' ? m.poolTransparent : kind ? ADDRESS_KIND_LABEL[kind] : undefined
  return (
    <span className={cx('nui-address', full && 'nui-address--full', className)} data-kind={kind} {...rest}>
      {showKind && kindLabel && <span className="nui-address__type">{kindLabel}</span>}
      <TruncText className="nui-address__text" value={address} truncate={full ? false : truncate} href={href} />
      {copyable && <CopyButton value={address} label={m.copyAddress} />}
    </span>
  )
}

export interface HashProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** txid, block hash, state root… */
  value: string
  truncate?: Truncate
  copyable?: boolean
  /** Internal link (explorer detail page). */
  href?: string
}

/** Same anatomy as Address without the kind label. */
export function Hash({ value, truncate = [8, 6], copyable = true, href, className, ...rest }: HashProps) {
  const { m } = useNuiLocale()
  return (
    <span className={cx('nui-hash', className)} {...rest}>
      <TruncText className="nui-hash__text" value={value} truncate={truncate} href={href} />
      {copyable && <CopyButton value={value} label={m.copyHash} />}
    </span>
  )
}
