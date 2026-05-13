import { z } from 'zod'
import type { FinanceData, SavedProject } from '@/lib/types'
import { EMPTY_FINANCE_DATA } from '@/lib/finance-defaults'
import { normalizeFinanceData, parseSavedProjects } from '@/lib/normalize-finance-data'
import { monthKeyFromDate, sortMonthKeysAsc } from '@/lib/schedule-utils'

export type ScheduleCompletionStore = Record<string, Record<string, boolean>>

export type SimulatorPersistedBundle = {
  version: 2
  activeMonthKey: string
  monthlySnapshots: Record<string, FinanceData>
  savedProjects: SavedProject[]
  activeProjectId: string | null
  scheduleCompletion: ScheduleCompletionStore
}

const scheduleCompletionSchema = z.record(z.string(), z.record(z.string(), z.boolean()))

/** Clés optionnelles : évite un rejet 400 si un client envoie une enveloppe partielle. */
const rawPayloadSchema = z.object({
  version: z.number().int().optional(),
  financeData: z.unknown().optional(),
  monthlySnapshots: z.unknown().optional(),
  activeMonthKey: z.string().optional(),
  savedProjects: z.unknown().optional(),
  activeProjectId: z.string().nullable().optional(),
  scheduleCompletion: z.unknown().optional(),
})

function normalizeScheduleCompletion(raw: unknown): ScheduleCompletionStore {
  const parsed = scheduleCompletionSchema.safeParse(raw)
  return parsed.success ? parsed.data : {}
}

function normalizeMonthlySnapshotsRecord(raw: unknown): Record<string, FinanceData> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, FinanceData> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}$/.test(k)) continue
    out[k] = normalizeFinanceData(v)
  }
  return out
}

function inferMigrationMonthKey(scheduleCompletion: ScheduleCompletionStore): string | null {
  const keys = Object.keys(scheduleCompletion).filter((k) => /^\d{4}-\d{2}$/.test(k))
  if (keys.length === 0) return null
  return sortMonthKeysAsc(keys).at(-1) ?? null
}

export function createDefaultSimulatorBundleSync(
  getExample: (lang: 'fr' | 'en') => FinanceData,
  lang: 'fr' | 'en',
): SimulatorPersistedBundle {
  const key = monthKeyFromDate()
  return {
    version: 2,
    activeMonthKey: key,
    monthlySnapshots: { [key]: structuredClone(getExample(lang)) },
    savedProjects: [],
    activeProjectId: null,
    scheduleCompletion: {},
  }
}

export function bundleFromApiJson(raw: unknown): SimulatorPersistedBundle | null {
  const r = rawPayloadSchema.safeParse(raw)
  if (!r.success) return null
  const o = r.data
  const scheduleCompletion = normalizeScheduleCompletion(o.scheduleCompletion)
  const savedProjects = parseSavedProjects(o.savedProjects ?? [])
  const activeProjectId = typeof o.activeProjectId === 'string' ? o.activeProjectId : null

  let monthlySnapshots = normalizeMonthlySnapshotsRecord(o.monthlySnapshots)
  if (Object.keys(monthlySnapshots).length === 0) {
    const legacy = normalizeFinanceData(o.financeData)
    const fromSchedule = inferMigrationMonthKey(scheduleCompletion)
    const key = fromSchedule ?? monthKeyFromDate()
    monthlySnapshots = { [key]: legacy }
  }

  const sortedKeys = sortMonthKeysAsc(Object.keys(monthlySnapshots))
  const requested = typeof o.activeMonthKey === 'string' ? o.activeMonthKey : undefined
  let activeMonthKey =
    requested && monthlySnapshots[requested] ? requested : (sortedKeys[0] ?? monthKeyFromDate())

  if (!monthlySnapshots[activeMonthKey]) {
    activeMonthKey = sortedKeys[0] ?? monthKeyFromDate()
    if (!monthlySnapshots[activeMonthKey]) {
      monthlySnapshots = { ...monthlySnapshots, [activeMonthKey]: structuredClone(EMPTY_FINANCE_DATA) }
    }
  }

  return {
    version: 2,
    activeMonthKey,
    monthlySnapshots,
    savedProjects,
    activeProjectId,
    scheduleCompletion,
  }
}

export function bundleToApiJson(bundle: SimulatorPersistedBundle) {
  const financeData = bundle.monthlySnapshots[bundle.activeMonthKey] ?? EMPTY_FINANCE_DATA
  return {
    version: 2 as const,
    activeMonthKey: bundle.activeMonthKey,
    monthlySnapshots: bundle.monthlySnapshots,
    financeData,
    savedProjects: bundle.savedProjects,
    activeProjectId: bundle.activeProjectId,
    scheduleCompletion: bundle.scheduleCompletion,
  }
}
