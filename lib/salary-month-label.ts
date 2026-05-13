/** Libellé mois long (« janvier » → « Janvier »). */
export function formatMonthLongName(month: number, language: string): string {
  const d = new Date(2000, month - 1, 1)
  const raw = d.toLocaleDateString(language, { month: 'long' })
  if (!raw) return String(month)
  return raw.charAt(0).toLocaleUpperCase(language) + raw.slice(1)
}

/** Affiche `YYYY-MM` en « Janvier 2021 » (selon la langue). */
export function formatYearMonthLabel(ym: string, language: string): string {
  const [ys, ms] = ym.split('-')
  const y = Number(ys)
  const m = Number(ms)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return ym
  return `${formatMonthLongName(m, language)} ${y}`
}
