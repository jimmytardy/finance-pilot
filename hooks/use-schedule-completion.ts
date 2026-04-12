'use client'

import { useCallback, useEffect, useState } from 'react'
import { monthKeyFromDate } from '@/lib/schedule-utils'

const STORAGE_KEY = 'finance-pilot-schedule-completion'
const LEGACY_SCHEDULE_STORAGE_KEY = 'finance-schedule-manual-completion'

type CompletionStore = Record<string, Record<string, boolean>>

function readStore(): CompletionStore {
  if (typeof window === 'undefined') return {}
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_SCHEDULE_STORAGE_KEY) ?? undefined
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw)
        localStorage.removeItem(LEGACY_SCHEDULE_STORAGE_KEY)
      }
    }
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as CompletionStore
  } catch {
    return {}
  }
}

function writeStore(store: CompletionStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function useScheduleCompletion() {
  const [store, setStore] = useState<CompletionStore>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setStore(readStore())
    setLoaded(true)
  }, [])

  const getDone = useCallback(
    (itemKey: string, keyMonth = monthKeyFromDate()) => {
      return !!store[keyMonth]?.[itemKey]
    },
    [store],
  )

  const setDone = useCallback((itemKey: string, done: boolean, keyMonth = monthKeyFromDate()) => {
    setStore((prev) => {
      const next: CompletionStore = {
        ...prev,
        [keyMonth]: { ...prev[keyMonth], [itemKey]: done },
      }
      writeStore(next)
      return next
    })
  }, [])

  const resetMonth = useCallback((keyMonth: string) => {
    setStore((prev) => {
      const next = { ...prev }
      delete next[keyMonth]
      writeStore(next)
      return next
    })
  }, [])

  const setManyDone = useCallback((itemKeys: string[], done: boolean, keyMonth = monthKeyFromDate()) => {
    if (itemKeys.length === 0) return
    setStore((prev) => {
      const base = prev[keyMonth] ?? {}
      const nextMonth = { ...base }
      for (const k of itemKeys) {
        nextMonth[k] = done
      }
      const next = { ...prev, [keyMonth]: nextMonth }
      writeStore(next)
      return next
    })
  }, [])

  return { loaded, getCurrentMonthKey: monthKeyFromDate, getDone, setDone, setManyDone, resetMonth }
}
