import type { HTMLAttributes } from 'react'
import { useNuiLocale } from '../../i18n'
import { ChevronIcon } from '../../icons'
import { cx } from '../../utils/cx'
import { paginationRange } from '../../utils/misc'

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** 1-based current page. */
  page: number
  pages: number
  onChange: (page: number) => void
  /** Pages shown on each side of the current one (default 1). */
  siblings?: number
  /** nav aria-label (default m.page). */
  label?: string
  disabled?: boolean
}

export function Pagination({ page, pages, onChange, siblings = 1, label, disabled, className, ...rest }: PaginationProps) {
  const { m } = useNuiLocale()
  if (pages < 1) return null
  const items = paginationRange(page, pages, siblings)
  const go = (p: number) => {
    if (p >= 1 && p <= pages && p !== page) onChange(p)
  }
  return (
    <nav className={cx('nui-pagination', className)} aria-label={label ?? m.page} {...rest}>
      <button
        type="button"
        className="nui-pagination__btn nui-pagination__prev"
        aria-label={m.previous}
        disabled={disabled || page <= 1}
        onClick={() => go(page - 1)}
      >
        <ChevronIcon size={10} />
      </button>
      {items.map((it, i) =>
        it === 'gap' ? (
          <span key={`g${i}`} className="nui-pagination__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            className="nui-pagination__btn nui-pagination__num"
            aria-current={it === page ? 'page' : undefined}
            aria-label={`${m.page} ${it}`}
            disabled={disabled}
            onClick={() => go(it)}
          >
            {it}
          </button>
        ),
      )}
      <button
        type="button"
        className="nui-pagination__btn nui-pagination__next"
        aria-label={m.next}
        disabled={disabled || page >= pages}
        onClick={() => go(page + 1)}
      >
        <ChevronIcon size={10} />
      </button>
    </nav>
  )
}
