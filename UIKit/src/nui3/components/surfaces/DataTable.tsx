import { useMemo, useState, type CSSProperties, type HTMLAttributes, type Key, type ReactNode } from 'react'
import { useNuiLocale } from '../../i18n'
import { cx } from '../../utils/cx'
import { EmptyState, Skeleton } from './Feedback'

export type SortDirection = 'ascending' | 'descending'
export interface DataTableSort {
  key: string
  direction: SortDirection
}

export type SortValue = string | number | bigint | Date | null | undefined

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  cell: (row: T, index: number) => ReactNode
  /** Right-aligned + tabular-nums (`.is-num`). */
  numeric?: boolean
  /** Makes the column sortable. Return a comparable value (bigint amounts compare exactly). */
  sortValue?: (row: T) => SortValue
  width?: CSSProperties['width']
}

export interface DataTableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: DataTableColumn<T>[]
  rows: readonly T[]
  rowKey: keyof T | ((row: T, index: number) => Key)
  /** aria-busy + header kept + skeleton rows. */
  loading?: boolean
  /** Number of skeleton rows while loading (default 5). */
  loadingRows?: number
  /** Rendered instead of an empty table (default: EmptyState with m.noResults). */
  empty?: ReactNode
  /** Enhancement only — rows must still contain a focusable link/button for keyboard users. */
  onRowClick?: (row: T, index: number) => void
  defaultSort?: DataTableSort
  /** Controlled sort. */
  sort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort) => void
  /** Visually hidden caption (table name for screen readers). */
  caption?: ReactNode
  /** Mark a row invalid (data-invalid) or selected (data-selected, accent left rule). */
  rowInvalid?: (row: T, index: number) => boolean
  rowSelected?: (row: T, index: number) => boolean
}

function compare(a: SortValue, b: SortValue): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (a instanceof Date) a = a.getTime()
  if (b instanceof Date) b = b.getTime()
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  if (typeof a === 'bigint' || typeof b === 'bigint') {
    const x = BigInt(a as bigint | number)
    const y = BigInt(b as bigint | number)
    return x < y ? -1 : x > y ? 1 : 0
  }
  return (a as number) < (b as number) ? -1 : (a as number) > (b as number) ? 1 : 0
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  loadingRows = 5,
  empty,
  onRowClick,
  defaultSort,
  sort: sortProp,
  onSortChange,
  caption,
  rowInvalid,
  rowSelected,
  className,
  ...rest
}: DataTableProps<T>) {
  const { m } = useNuiLocale()
  const [innerSort, setInnerSort] = useState<DataTableSort | null>(defaultSort ?? null)
  const sort = sortProp !== undefined ? sortProp : innerSort

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows.map((row, i) => ({ row, i }))
    const sv = col.sortValue
    const dir = sort!.direction === 'ascending' ? 1 : -1
    return rows
      .map((row, i) => ({ row, i, v: sv(row) }))
      .sort((a, b) => {
        // Missing values (e.g. amounts hidden by the shielded pool) always sort last.
        if (a.v == null || b.v == null) return a.v == null && b.v == null ? a.i - b.i : a.v == null ? 1 : -1
        return compare(a.v, b.v) * dir || a.i - b.i
      })
  }, [rows, columns, sort])

  const toggle = (key: string) => {
    const next: DataTableSort =
      sort?.key === key ? { key, direction: sort.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' }
    if (sortProp === undefined) setInnerSort(next)
    onSortChange?.(next)
  }

  const keyOf = (row: T, i: number): Key => (typeof rowKey === 'function' ? rowKey(row, i) : (row[rowKey] as unknown as Key))

  if (!loading && rows.length === 0) {
    return (
      <div className={cx('nui-table-wrap', className)} {...rest}>
        {empty ?? <EmptyState title={m.noResults} />}
      </div>
    )
  }

  return (
    <div className={cx('nui-table-wrap', className)} {...rest}>
      <table className="nui-table" aria-busy={loading || undefined}>
        {caption != null && <caption className="nui-sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key && !!c.sortValue
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={c.numeric ? 'is-num' : undefined}
                  style={c.width != null ? { width: c.width } : undefined}
                  aria-sort={active ? sort!.direction : undefined}
                >
                  {c.sortValue ? (
                    <button type="button" className="nui-table__sort" onClick={() => toggle(c.key)}>
                      {c.header}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: loadingRows }, (_, r) => (
                <tr key={`sk-${r}`} aria-hidden="true">
                  {columns.map((c, ci) => (
                    <td key={c.key} className={c.numeric ? 'is-num' : undefined}>
                      <Skeleton width={c.numeric ? '4em' : ci === 0 ? '8em' : '6em'} />
                    </td>
                  ))}
                </tr>
              ))
            : sorted.map(({ row, i }) => (
                <tr
                  key={keyOf(row, i)}
                  data-clickable={onRowClick ? 'true' : undefined}
                  data-invalid={rowInvalid?.(row, i) ? 'true' : undefined}
                  data-selected={rowSelected?.(row, i) ? 'true' : undefined}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={c.numeric ? 'is-num' : undefined}>
                      {c.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
