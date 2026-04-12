'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FinanceData, SavedProject } from '@/lib/types'
import { normalizeFinanceData, parseSavedProjects } from '@/lib/normalize-finance-data'

const STORAGE_KEY = 'finance-pilot-saved-projects'
const LEGACY_PROJECTS_STORAGE_KEY = 'finance-dashboard-saved-projects'
const ACTIVE_PROJECT_KEY = 'finance-pilot-active-project-id'
const LEGACY_ACTIVE_PROJECT_KEY = 'finance-active-project-id'

function readStoredActiveProjectId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    let raw = localStorage.getItem(ACTIVE_PROJECT_KEY)
    if (!raw?.trim()) {
      const legacy = localStorage.getItem(LEGACY_ACTIVE_PROJECT_KEY)
      if (legacy?.trim()) {
        raw = legacy.trim()
        localStorage.setItem(ACTIVE_PROJECT_KEY, raw)
        localStorage.removeItem(LEGACY_ACTIVE_PROJECT_KEY)
      }
    }
    if (!raw?.trim()) return null
    return raw.trim()
  } catch {
    return null
  }
}

function writeStoredActiveProjectId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_PROJECT_KEY, id)
    else localStorage.removeItem(ACTIVE_PROJECT_KEY)
  } catch {
    /* ignore */
  }
}

function sortProjects(list: SavedProject[]) {
  return [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function useSavedProjects() {
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => readStoredActiveProjectId())

  useEffect(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_PROJECTS_STORAGE_KEY)
        if (legacy) {
          raw = legacy
          localStorage.setItem(STORAGE_KEY, legacy)
          localStorage.removeItem(LEGACY_PROJECTS_STORAGE_KEY)
        }
      }
      if (raw) {
        setProjects(sortProjects(parseSavedProjects(JSON.parse(raw))))
      }
    } catch (error) {
      console.error('Error loading saved projects:', error)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch (error) {
      console.error('Error saving projects list:', error)
    }
  }, [projects, isLoaded])

  useEffect(() => {
    if (!isLoaded || !activeProjectId) return
    if (!projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectIdState(null)
      writeStoredActiveProjectId(null)
    }
  }, [isLoaded, projects, activeProjectId])

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id)
    writeStoredActiveProjectId(id)
  }, [])

  const addProject = useCallback((name: string, data: FinanceData): string | null => {
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
    setProjects((prev) => sortProjects([...prev, project]))
    return id
  }, [])

  const updateProjectSnapshot = useCallback((id: string, data: FinanceData) => {
    setProjects((prev) => {
      if (!prev.some((p) => p.id === id)) return prev
      const normalized = normalizeFinanceData(JSON.parse(JSON.stringify(data)))
      return sortProjects(
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                data: normalized,
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      )
    })
  }, [])

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setActiveProjectIdState((active) => {
      if (active !== id) return active
      writeStoredActiveProjectId(null)
      return null
    })
  }, [])

  return useMemo(
    () => ({
      projects,
      isLoaded,
      activeProjectId,
      setActiveProjectId,
      addProject,
      updateProjectSnapshot,
      removeProject,
    }),
    [projects, isLoaded, activeProjectId, setActiveProjectId, addProject, updateProjectSnapshot, removeProject],
  )
}
