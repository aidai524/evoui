import { docs as actions } from './groups/actions.docs'
import { docs as charts } from './groups/charts.docs'
import { docs as content } from './groups/content.docs'
import { docs as data } from './groups/data.docs'
import { docs as defi } from './groups/defi.docs'
import { docs as forms } from './groups/forms.docs'
import { docs as foundation } from './groups/foundation.docs'
import { docs as navigation } from './groups/navigation.docs'
import { docs as overlays } from './groups/overlays.docs'
import { docs as payments } from './groups/payments.docs'
import { docs as prediction } from './groups/prediction.docs'
import { docs as surfaces } from './groups/surfaces.docs'
import { docs as themeI18n } from './groups/theme.docs'
import { docs as trading } from './groups/trading.docs'
import { docs as zcash } from './groups/zcash.docs'
import { GROUPS, slug, type ComponentDoc } from './types'

const all: ComponentDoc[] = [...themeI18n, ...foundation, ...actions, ...forms, ...navigation, ...surfaces, ...overlays, ...zcash, ...defi, ...trading, ...charts, ...data, ...prediction, ...content, ...payments]

/** Ordered by GROUPS, then declaration order within a group. */
export const REGISTRY: ComponentDoc[] = GROUPS.flatMap((g) => all.filter((d) => d.group === g.id))
export const bySlug = (s: string) => REGISTRY.find((d) => slug(d.name) === s)
