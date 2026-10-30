import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

export type TimelineTone = 'neutral' | 'accent' | 'positive' | 'negative' | 'info'

export interface TimelineItem {
  title: ReactNode
  /** Display text for the time. */
  time?: ReactNode
  /** Machine-readable datetime for `<time dateTime>`. */
  dateTime?: string
  description?: ReactNode
  tone?: TimelineTone
}

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[]
}

export function Timeline({ items, className, ...rest }: TimelineProps) {
  return (
    <ol className={cx('nui-timeline', className)} {...rest}>
      {items.map((it, i) => (
        <li key={i} className="nui-timeline__item" data-tone={it.tone && it.tone !== 'neutral' ? it.tone : undefined}>
          <span className="nui-timeline__dot" aria-hidden="true" />
          <div className="nui-timeline__content">
            <div className="nui-timeline__row">
              <p className="nui-timeline__title">{it.title}</p>
              {it.time != null && (
                <time className="nui-timeline__time" dateTime={it.dateTime}>
                  {it.time}
                </time>
              )}
            </div>
            {it.description != null && <p className="nui-timeline__desc">{it.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
