/** "onsdag 16. september" for a YYYY-MM-DD key, in Danish. */
export function formatDailyDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
