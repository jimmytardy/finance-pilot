import { z } from 'zod'
import type { FinanceData, SavedProject } from '@/lib/types'
import { normalizeFinanceData, parseSavedProjects } from '@/lib/normalize-finance-data'

export type ScheduleCompletionStore = Record<string, Record<string, boolean>>

export type SimulatorPersistedBundle = {
  version: 1
  financeData: FinanceData
  savedProjects: SavedProject[]
  activeProjectId: string | null
  scheduleCompletion: ScheduleCompletionStore
}

const scheduleCompletionSchema = z.record(z.string(), z.record(z.string(), z.boolean()))

const rawPayloadSchema = z.object({
  version: z.number().int().optional(),
  financeData: z.unknown(),
  savedProjects: z.unknown(),
  activeProjectId: z.string().nullable().optional(),
  scheduleCompletion: z.unknown().optional(),
})

function normalizeScheduleCompletion(raw: unknown): ScheduleCompletionStore {
  const parsed = scheduleCompletionSchema.safeParse(raw)
  return parsed.success ? parsed.data : {}
}

export function createDefaultSimulatorBundleSync(
  getExample: (lang: 'fr' | 'en') => FinanceData,
  lang: 'fr' | 'en',
): SimulatorPersistedBundle {
  return {
    version: 1,
    financeData: structuredClone(getExample(lang)),
    savedProjects: [],
    activeProjectId: null,
    scheduleCompletion: {},
  }
}

export function bundleFromApiJson(raw: unknown): SimulatorPersistedBundle | null {
  const r = rawPayloadSchema.safeParse(raw)
  if (!r.success) return null
  const o = r.data
  return {
    version: 1,
    financeData: normalizeFinanceData(o.financeData),
    savedProjects: parseSavedProjects(o.savedProjects),
    activeProjectId: typeof o.activeProjectId === 'string' ? o.activeProjectId : null,
    scheduleCompletion: normalizeScheduleCompletion(o.scheduleCompletion),
  }
}

export function bundleToApiJson(bundle: SimulatorPersistedBundle) {
  return {
    version: 1 as const,
    financeData: bundle.financeData,
    savedProjects: bundle.savedProjects,
    activeProjectId: bundle.activeProjectId,
    scheduleCompletion: bundle.scheduleCompletion,
  }
}
