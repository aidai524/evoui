import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { Identicon } from './Identicon'

export interface NFTCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  name: string
  collection?: ReactNode
  /** Image URL. Without it a deterministic `Identicon variant="art"` stands in. */
  image?: string
  /** Alt text for the image (default ''; the name is already the card heading). */
  imageAlt?: string
  /** Seed for the placeholder art (default `name`). */
  seed?: string
  /** Top-left overlay (Badge / PrivacyBadge). */
  badge?: ReactNode
  price?: ReactNode
  /** Right side of the foot, 12px muted (last sale, edition…). */
  meta?: ReactNode
  /** Makes the whole card clickable via a stretched link on the name. */
  href?: string
  titleAs?: ElementType
}

export function NFTCard({ name, collection, image, imageAlt = '', seed, badge, price, meta, href, titleAs: Title = 'h3', className, ...rest }: NFTCardProps) {
  return (
    <article className={cx('nui-nft', className)} data-clickable={href ? 'true' : undefined} {...rest}>
      <div className="nui-nft__media">
        {image ? <img src={image} alt={imageAlt} loading="lazy" /> : <Identicon value={seed ?? name} variant="art" size="100%" />}
        {badge != null && <div className="nui-nft__badge">{badge}</div>}
      </div>
      <div className="nui-nft__body">
        {collection != null && <p className="nui-nft__collection">{collection}</p>}
        <Title className="nui-nft__name" title={name}>
          {href ? (
            <a className="nui-nft__link" href={href}>
              {name}
            </a>
          ) : (
            name
          )}
        </Title>
        {(price != null || meta != null) && (
          <div className="nui-nft__foot">
            <span className="nui-nft__price">{price}</span>
            {meta != null && <span className="nui-nft__meta">{meta}</span>}
          </div>
        )}
      </div>
    </article>
  )
}
