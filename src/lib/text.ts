/** Replaces `{key}` placeholders in a template with the given values. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

/** Lower-case and strip accents so "Rías" matches "rias". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Joins items in Danish: "a, b og c". */
export function joinList(items: string[], and: string): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`
}

/** Upper-cases the first character, e.g. for a colour label at the start of a line. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
