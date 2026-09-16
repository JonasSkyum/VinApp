import { content } from '@/content'
import { createCatalog } from '@/engine'

/** App-wide catalog built once from the bundled content. */
export const catalog = createCatalog(content)
