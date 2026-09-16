import { descriptors } from './descriptors'
import { grapes } from './grapes'
import { regions } from './regions'
import { styles } from './styles'
import type { ContentBundle } from './validate'

export { descriptors, grapes, regions, styles }

/** Everything the game and the validator consume, in one object. */
export const content: ContentBundle = { descriptors, grapes, regions, styles }
