import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'

type Poly<P> = P & Omit<HTMLAttributes<HTMLElement>, keyof P> & { as?: ElementType; children?: ReactNode }

/** Space step → token. Only steps on the scale are legal. */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32
const space = (n: SpaceStep) => `var(--nui-space-${n})`

export function Display({ as: Tag = 'h1', size = 'm', className, ...rest }: Poly<{ size?: 'xl' | 'l' | 'm' | 's' }>) {
  return <Tag className={cx('nui-display', size !== 'm' && `nui-display--${size}`, className)} {...rest} />
}

export function Heading({ level = 2, as, className, ...rest }: Poly<{ level?: 2 | 3 | 4 }>) {
  const Tag = as ?? (`h${level}` as ElementType)
  return <Tag className={cx('nui-heading', level !== 2 && `nui-heading--${level}`, className)} {...rest} />
}

export function Eyebrow({ as: Tag = 'p', accent, className, ...rest }: Poly<{ accent?: boolean }>) {
  return <Tag className={cx('nui-eyebrow', accent && 'nui-eyebrow--accent', className)} {...rest} />
}

export function Lead({ as: Tag = 'p', className, ...rest }: Poly<object>) {
  return <Tag className={cx('nui-lead', className)} {...rest} />
}

export function Shell({ as: Tag = 'div', className, ...rest }: Poly<object>) {
  return <Tag className={cx('nui-shell', className)} {...rest} />
}

export type SectionTone = 'default' | 'inverse' | 'plum' | 'navy'

/** Marketing-rhythm block. Brand dark tones must never be adjacent (02 §11). */
export function Section({ as: Tag = 'section', tone = 'default', contained = true, className, children, ...rest }: Poly<{ tone?: SectionTone; contained?: boolean }>) {
  return (
    <Tag className={cx('nui-section', tone !== 'default' && `nui-section--${tone}`, className)} {...rest}>
      {contained ? <div className="nui-shell">{children}</div> : children}
    </Tag>
  )
}

export function Stack({ as: Tag = 'div', gap = 4, className, style, ...rest }: Poly<{ gap?: SpaceStep }>) {
  return <Tag className={cx('nui-stack', className)} style={{ '--nui-stack-gap': space(gap), ...style } as CSSProperties} {...rest} />
}

export function Cluster({
  as: Tag = 'div',
  gap = 3,
  justify,
  className,
  style,
  ...rest
}: Poly<{ gap?: SpaceStep; justify?: CSSProperties['justifyContent'] }>) {
  return (
    <Tag
      className={cx('nui-cluster', className)}
      style={{ '--nui-cluster-gap': space(gap), ...(justify ? { '--nui-cluster-justify': justify } : null), ...style } as CSSProperties}
      {...rest}
    />
  )
}

/** Columns collapse 3/4 → 2 @1080px → 1 @640px via modifier classes; `auto` uses minmax(min, 1fr). */
export function Grid({ as: Tag = 'div', cols = 3, min, className, style, ...rest }: Poly<{ cols?: 1 | 2 | 3 | 4 | 'auto'; min?: string }>) {
  return (
    <Tag
      className={cx('nui-grid', `nui-grid--${cols}`, className)}
      style={{ ...(cols === 'auto' && min ? { '--nui-min': min } : null), ...style } as CSSProperties}
      {...rest}
    />
  )
}
