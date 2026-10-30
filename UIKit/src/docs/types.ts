import type { ReactNode } from 'react'

export type GroupId =
  | 'theme'
  | 'foundation'
  | 'actions'
  | 'forms'
  | 'navigation'
  | 'surfaces'
  | 'overlays'
  | 'zcash'
  | 'defi'
  | 'trading'
  | 'charts'
  | 'data'
  | 'prediction'
  | 'content'
  | 'payments'
  | 'i18n'

export const GROUPS: { id: GroupId; title: string; count: number }[] = [
  { id: 'theme', title: 'Theme', count: 2 },
  { id: 'foundation', title: 'Foundation', count: 11 },
  { id: 'actions', title: 'Actions', count: 6 },
  { id: 'forms', title: 'Forms', count: 10 },
  { id: 'navigation', title: 'Navigation', count: 6 },
  { id: 'surfaces', title: 'Surfaces', count: 13 },
  { id: 'overlays', title: 'Overlays', count: 4 },
  { id: 'zcash', title: 'Zcash', count: 14 },
  { id: 'defi', title: 'DeFi', count: 5 },
  { id: 'trading', title: 'Trading', count: 6 },
  { id: 'charts', title: 'Charts', count: 10 },
  { id: 'data', title: 'Data', count: 2 },
  { id: 'prediction', title: 'Prediction', count: 2 },
  { id: 'content', title: 'Content', count: 9 },
  { id: 'payments', title: 'Payments', count: 2 },
  { id: 'i18n', title: 'i18n', count: 1 },
]

/** One entry per component in spec/04 (101 total). */
export interface ComponentDoc {
  /** Exact component name from spec/04, e.g. "TokenAmountInput", "CopyButton / useCopy". */
  name: string
  group: GroupId
  /** Root class, e.g. "nui-token-input"; empty for hooks/providers without DOM. */
  className: string
  /** One or two sentences: purpose + key rule. */
  description: string
  /** Live demo; omit for pure utilities/hooks ("No visual demo for this utility."). */
  Demo?: () => ReactNode
  /** Usage snippet: import + minimal example. */
  usage: string
  /** [prop, type or signature] rows. */
  props?: [string, string][]
}

export const slug = (name: string) => name.split(/\s*\/\s*/)[0].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
