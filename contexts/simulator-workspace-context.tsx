'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import type { FinanceData, SavedProject } from '@/lib/types'
import { normalizeFinanceData } from '@/lib/normalize-finance-data'
import { getLocalizedExampleFinanceData, matchesBuiltInExample } from '@/lib/example-finance-localized'
import { monthKeyFromDate } from '@/lib/schedule-utils'
import i18n from '@/lib/i18n/i18n'
import {
  bundleFromApiJson,
  bundleToApiJson,
  createDefaultSimulatorBundleSync,
  type ScheduleCompletionStore,
  type SimulatorPersistedBundle,
} from '@/lib/simulator-payload'
import { useSimulatorServerGoogleOAuthConfigured } from '@/contexts/simulator-server-auth-context'
import { isGoogleAuthConfiguredPublic } from '@/lib/auth-public'

function sortProjects(list: SavedProject[]) {
  return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

function resolveLang(lng: string | undefined): 'fr' | 'en' {
  return lng?.startsWith('en') ? 'en' : 'fr'
}

type SimulatorWorkspaceContextValue = {
  setFinanceData: Dispatch<SetStateAction<FinanceData>>
  financeData: FinanceData
  financeLoaded: boolean
  authLoading: boolean
  persistenceRemote: boolean
  /** OAuth Google utilisable (serveur et/ou NEXT_PUBLIC_CLIENT_ID). */
  googleAuthConfigured: boolean
  projects: SavedProject[]
  isLoadedProjects: boolean
  activeProjectId: string | null
  setActiveProjectId: (id: string | null) => void
  addProject: (name: string, data: FinanceData) => string | null
  updateProjectSnapshot: (id: string, data: FinanceData) => void
  removeProject: (id: string) => void
  scheduleLoaded: boolean
  getDone: (itemKey: string, keyMonth?: string) => boolean
  setDone: (itemKey: string, done: boolean, keyMonth?: string) => void
  setManyDone: (itemKeys: string[], done: boolean, keyMonth?: string) => void
  resetMonth: (keyMonth: string) => void
  getCurrentMonthKey: typeof monthKeyFromDate
}

const SimulatorWorkspaceContext = createContext<SimulatorWorkspaceContextValue | null>(null)

export function SimulatorWorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const { i18n } = useTranslation()
  const lang = resolveLang(i18n.language)

  const [bundle, setBundle] = useState<SimulatorPersistedBundle>(() =>
    createDefaultSimulatorBundleSync(getLocalizedExampleFinanceData, lang),
  )
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const skipNextPersist = useRef(true)

  const authLoading = status === 'loading'
  const persistenceRemote = status === 'authenticated'
  const googleOnServer = useSimulatorServerGoogleOAuthConfigured()
  const googleAuthConfigured = googleOnServer || isGoogleAuthConfiguredPublic()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      setBundle(createDefaultSimulatorBundleSync(getLocalizedExampleFinanceData, resolveLang(i18n.language)))
      setWorkspaceReady(true)
      skipNextPersist.current = true
      return
    }

    let cancelled = false
    skipNextPersist.current = true
    setWorkspaceReady(false)

    ;(async () => {
      try {
        const res = await fetch('/api/simulator/state', { credentials: 'same-origin' })
        if (!res.ok) throw new Error(String(res.status))
        const json: unknown = await res.json()
        if (cancelled) return
        if (json && typeof json === 'object') {
          const parsed = bundleFromApiJson(json)
          if (parsed) {
            setBundle(parsed)
          } else {
            setBundle(createDefaultSimulatorBundleSync(getLocalizedExampleFinanceData, resolveLang(i18n.language)))
          }
        } else {
          setBundle(createDefaultSimulatorBundleSync(getLocalizedExampleFinanceData, resolveLang(i18n.language)))
        }
      } catch {
        if (!cancelled) {
          setBundle(createDefaultSimulatorBundleSync(getLocalizedExampleFinanceData, resolveLang(i18n.language)))
        }
      } finally {
        if (!cancelled) {
          setWorkspaceReady(true)
          skipNextPersist.current = true
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status, session?.user?.id])

  useEffect(() => {
    if (status !== 'authenticated' || !workspaceReady) return
    if (skipNextPersist.current) {
      skipNextPersist.current = false
      return
    }
    const payload = bundleToApiJson(bundle)
    const timer = window.setTimeout(() => {
      void fetch('/api/simulator/state', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        /* réseau : prochaine édition réessaiera */
      })
    }, 900)
    return () => window.clearTimeout(timer)
  }, [bundle, status, workspaceReady])

  useEffect(() => {
    const onLang = (lng: string) => {
      setBundle((prev) => {
        if (!matchesBuiltInExample(prev.financeData)) return prev
        return {
          ...prev,
          financeData: structuredClone(getLocalizedExampleFinanceData(resolveLang(lng))),
        }
      })
    }
    i18n.on('languageChanged', onLang)
    return () => {
      i18n.off('languageChanged', onLang)
    }
  }, [])

  const setFinanceData = useCallback((next: SetStateAction<FinanceData>) => {
    setBundle((prev) => ({
      ...prev,
      financeData: typeof next === 'function' ? next(prev.financeData) : next,
    }))
  }, [])

  const setActiveProjectId = useCallback(
    (id: string | null) => {
      if (id !== null && status !== 'authenticated') return
      setBundle((prev) => ({ ...prev, activeProjectId: id }))
    },
    [status],
  )

  const addProject = useCallback((name: string, data: FinanceData): string | null => {
    if (status !== 'authenticated') return null
    const trimmed = name.trim()
    if (!trimmed) return null
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const project: SavedProject = {
      id,
      name: trimmed,
      createdAt: now,
      updatedAt: now,
      data: normalizeFinanceData(JSON.parse(JSON.stringify(data))),
    }
    setBundle((prev) => ({
      ...prev,
      savedProjects: sortProjects([...prev.savedProjects, project]),
    }))
    return id
  }, [])

  const updateProjectSnapshot = useCallback((id: string, data: FinanceData) => {
    setBundle((prev) => {
      if (!prev.savedProjects.some((p) => p.id === id)) return prev
      const normalized = normalizeFinanceData(JSON.parse(JSON.stringify(data)))
      return {
        ...prev,
        savedProjects: sortProjects(
          prev.savedProjects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  data: normalized,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        ),
      }
    })
  }, [])

  const removeProject = useCallback((id: string) => {
    setBundle((prev) => ({
      ...prev,
      activeProjectId: prev.activeProjectId === id ? null : prev.activeProjectId,
      savedProjects: prev.savedProjects.filter((p) => p.id !== id),
    }))
  }, [])

  const activeProjectStillExists =
    !!bundle.activeProjectId && bundle.savedProjects.some((p) => p.id === bundle.activeProjectId)

  useEffect(() => {
    if (!workspaceReady || !bundle.activeProjectId) return
    if (!activeProjectStillExists) {
      setBundle((prev) => ({ ...prev, activeProjectId: null }))
    }
  }, [workspaceReady, bundle.activeProjectId, activeProjectStillExists])

  const getDone = useCallback(
    (itemKey: string, keyMonth = monthKeyFromDate()) => {
      return !!bundle.scheduleCompletion[keyMonth]?.[itemKey]
    },
    [bundle.scheduleCompletion],
  )

  const setDone = useCallback((itemKey: string, done: boolean, keyMonth = monthKeyFromDate()) => {
    setBundle((prev) => ({
      ...prev,
      scheduleCompletion: {
        ...prev.scheduleCompletion,
        [keyMonth]: { ...prev.scheduleCompletion[keyMonth], [itemKey]: done },
      },
    }))
  }, [])

  const resetMonth = useCallback((keyMonth: string) => {
    setBundle((prev) => {
      const next: ScheduleCompletionStore = { ...prev.scheduleCompletion }
      delete next[keyMonth]
      return { ...prev, scheduleCompletion: next }
    })
  }, [])

  const setManyDone = useCallback((itemKeys: string[], done: boolean, keyMonth = monthKeyFromDate()) => {
    if (itemKeys.length === 0) return
    setBundle((prev) => {
      const base = prev.scheduleCompletion[keyMonth] ?? {}
      const nextMonth = { ...base }
      for (const k of itemKeys) {
        nextMonth[k] = done
      }
      return {
        ...prev,
        scheduleCompletion: { ...prev.scheduleCompletion, [keyMonth]: nextMonth },
      }
    })
  }, [])

  const financeLoaded =
    status === 'loading' ? false : status === 'unauthenticated' ? true : workspaceReady
  const isLoadedProjects = financeLoaded
  const scheduleLoaded = financeLoaded

  const value = useMemo(
    () => ({
      setFinanceData,
      financeData: bundle.financeData,
      financeLoaded,
      authLoading,
      persistenceRemote,
      googleAuthConfigured,
      projects: bundle.savedProjects,
      isLoadedProjects,
      activeProjectId: bundle.activeProjectId,
      setActiveProjectId,
      addProject,
      updateProjectSnapshot,
      removeProject,
      scheduleLoaded,
      getDone,
      setDone,
      setManyDone,
      resetMonth,
      getCurrentMonthKey: monthKeyFromDate,
    }),
    [
      setFinanceData,
      bundle.financeData,
      bundle.savedProjects,
      bundle.activeProjectId,
      financeLoaded,
      authLoading,
      persistenceRemote,
      googleAuthConfigured,
      isLoadedProjects,
      setActiveProjectId,
      addProject,
      updateProjectSnapshot,
      removeProject,
      scheduleLoaded,
      getDone,
      setDone,
      setManyDone,
      resetMonth,
    ],
  )

  return <SimulatorWorkspaceContext.Provider value={value}>{children}</SimulatorWorkspaceContext.Provider>
}

export function useSimulatorWorkspace() {
  const ctx = useContext(SimulatorWorkspaceContext)
  if (!ctx) {
    throw new Error('useSimulatorWorkspace doit être utilisé sous SimulatorWorkspaceProvider')
  }
  return ctx
}

export function useSavedProjects() {
  const {
    projects,
    isLoadedProjects,
    activeProjectId,
    setActiveProjectId,
    addProject,
    updateProjectSnapshot,
    removeProject,
    persistenceRemote,
    googleAuthConfigured,
  } = useSimulatorWorkspace()
  return useMemo(
    () => ({
      projects,
      isLoaded: isLoadedProjects,
      activeProjectId,
      setActiveProjectId,
      addProject,
      updateProjectSnapshot,
      removeProject,
      persistenceRemote,
      googleAuthConfigured,
    }),
    [
      projects,
      isLoadedProjects,
      activeProjectId,
      setActiveProjectId,
      addProject,
      updateProjectSnapshot,
      removeProject,
      persistenceRemote,
      googleAuthConfigured,
    ],
  )
}

export function useScheduleCompletion() {
  const { scheduleLoaded, getDone, setDone, setManyDone, resetMonth, getCurrentMonthKey } = useSimulatorWorkspace()
  return {
    loaded: scheduleLoaded,
    getCurrentMonthKey,
    getDone,
    setDone,
    setManyDone,
    resetMonth,
  }
}
