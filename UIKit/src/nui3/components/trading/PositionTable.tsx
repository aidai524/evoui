import type { ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { Button } from '../actions'
import { Badge, DataTable, type DataTableColumn, type DataTableProps } from '../surfaces'
import { PnL } from './PnL'

export interface Position {
  id: string
  market: string
  side: 'long' | 'short'
  /** Position size, already a display string or number (e.g. "12.5 ZEC"). */
  size: ReactNode
  entry: number
  mark: number
  liq: number
  leverage: number
  pnl: number
  pnlPercent?: number
}

export interface PositionTableProps extends Omit<DataTableProps<Position>, 'columns' | 'rows' | 'rowKey'> {
  positions: Position[]
  /** Renders a "Close" button per row. */
  onClose?: (position: Position) => void
  priceDecimals?: number
  currency?: string
}

export function PositionTable({ positions, onClose, priceDecimals = 2, currency = 'USD', className, ...rest }: PositionTableProps) {
  const { m, number } = useNuiLocale()
  const fp = (n: number) => number(n, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })
  const columns: DataTableColumn<Position>[] = [
    { key: 'market', header: m.market, cell: (p) => <span className="nui-positions__market">{p.market}</span>, sortValue: (p) => p.market },
    {
      key: 'side',
      header: m.side,
      cell: (p) => <Badge tone={p.side === 'long' ? 'positive' : 'negative'}>{p.side === 'long' ? m.long : m.short}</Badge>,
    },
    { key: 'size', header: m.size, cell: (p) => p.size, numeric: true },
    { key: 'entry', header: m.entry, cell: (p) => fp(p.entry), numeric: true },
    { key: 'mark', header: m.mark, cell: (p) => fp(p.mark), numeric: true },
    { key: 'liq', header: m.liqPrice, cell: (p) => <span className="nui-positions__liq">{fp(p.liq)}</span>, numeric: true },
    { key: 'leverage', header: m.leverage, cell: (p) => `${number(p.leverage)}×`, numeric: true },
    {
      key: 'pnl',
      header: m.pnl,
      cell: (p) => <PnL value={p.pnl} percent={p.pnlPercent} currency={currency} />,
      numeric: true,
      sortValue: (p) => p.pnl,
    },
  ]
  if (onClose) {
    columns.push({
      key: 'actions',
      header: <span className="nui-sr-only">{m.closePosition}</span>,
      cell: (p) => (
        <Button size="sm" variant="outline" onClick={() => onClose(p)} aria-label={`${m.closePosition} ${p.market}`}>
          {m.closePosition}
        </Button>
      ),
      numeric: true,
    })
  }
  return <DataTable className={cx('nui-positions', className)} columns={columns} rows={positions} rowKey="id" {...rest} />
}
