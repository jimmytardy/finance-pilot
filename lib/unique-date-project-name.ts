/** Date du jour (calendrier local), format triable et sans ambiguïté de fuseau pour le « jour » affiché. */
export function localCalendarDayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Nom unique parmi les projets : `YYYY-MM-DD`, puis `YYYY-MM-DD-2`, etc. */
export function uniqueDateBackupProjectName<T extends { name: string }>(projects: T[], d = new Date()): string {
  const base = localCalendarDayKey(d)
  const names = new Set(projects.map((p) => p.name.trim()))
  if (!names.has(base)) return base
  let n = 2
  while (names.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
