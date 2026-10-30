import type { HTMLAttributes, ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import type { MessageKey } from '../../i18n'
import { GlobeIcon, LockIcon, ShieldIcon } from '../../icons'
import { cx } from '../../utils/cx'
import { Tooltip } from '../content'
import { PRIVACY_LEVELS, type PrivacyLevel } from '../../utils/misc'

export interface PrivacyLevelInfo {
  level: PrivacyLevel
  label: string
  description: string
}

/** Localised { label, description } for a privacy level (R6 wording). */
export function usePrivacyLevel(level: PrivacyLevel): PrivacyLevelInfo {
  const { m } = useNuiLocale()
  const meta = PRIVACY_LEVELS[level]
  return { level, label: m[meta.labelKey as MessageKey], description: m[meta.descriptionKey as MessageKey] }
}

const ICON = { shielded: ShieldIcon, confidential: LockIcon, public: GlobeIcon } as const

export interface PrivacyBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  level: PrivacyLevel
  /** Attach the standard privacy*Desc description as a Tooltip (badge becomes focusable). */
  describe?: boolean
  /** Override the visible text (the level semantics stay). */
  label?: ReactNode
}

export function PrivacyBadge({ level, describe, label, className, ...rest }: PrivacyBadgeProps) {
  const info = usePrivacyLevel(level)
  const Icon = ICON[level]
  const badge = (
    <span className={cx('nui-privacy', className)} data-level={level} tabIndex={describe ? 0 : undefined} {...rest}>
      <Icon size={12} />
      {label ?? info.label}
    </span>
  )
  return describe ? <Tooltip content={info.description}>{badge}</Tooltip> : badge
}

export type Pool = 'orchard' | 'sapling' | 'transparent'
const POOL_KEY: Record<Pool, MessageKey> = { orchard: 'poolOrchard', sapling: 'poolSapling', transparent: 'poolTransparent' }

export interface PoolBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  pool: Pool
}

export function PoolBadge({ pool, className, ...rest }: PoolBadgeProps) {
  const { m } = useNuiLocale()
  return (
    <span className={cx('nui-pool', className)} data-pool={pool} {...rest}>
      {m[POOL_KEY[pool]]}
    </span>
  )
}

export interface ChainBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Chain name only, e.g. "NEAR". */
  chain: string
  icon?: ReactNode
}

export function ChainBadge({ chain, icon, className, ...rest }: ChainBadgeProps) {
  return (
    <span className={cx('nui-chain', className)} {...rest}>
      {icon && (
        <span className="nui-chain__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {chain}
    </span>
  )
}
