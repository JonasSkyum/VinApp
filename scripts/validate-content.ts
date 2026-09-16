/**
 * CLI wrapper around validateContent(). Exit code 1 on any error; warnings never fail.
 * Run with `npm run validate:content`.
 */
import { content } from '../src/content'
import { validateContent } from '../src/content/validate'

const { errors, warnings, stats } = validateContent(content)

for (const w of warnings) console.warn(`WARN  ${w.where}: ${w.message}`)
for (const e of errors) console.error(`ERROR ${e.where}: ${e.message}`)

const fmt = (c: { total: number; verified: number }) => `${c.verified}/${c.total} verified`
console.log('')
console.log(`descriptors: ${stats.descriptors}`)
console.log(`grapes:      ${fmt(stats.grapes)}`)
console.log(`regions:     ${fmt(stats.regions)}`)
console.log(`styles:      ${fmt(stats.styles)}`)
console.log('')
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`)

if (errors.length > 0) process.exit(1)
