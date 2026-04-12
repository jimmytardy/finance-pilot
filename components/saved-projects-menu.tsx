'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFinanceData } from '@/hooks/use-finance-data'
import { useSavedProjects } from '@/hooks/use-saved-projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FilePlus2, FolderOpen, Loader2, Save, Trash2, Upload } from 'lucide-react'
import { isFinanceDataEmpty } from '@/lib/finance-defaults'
import i18n from '@/lib/i18n/i18n'
import { getLocalizedExampleFinanceData } from '@/lib/example-finance-localized'
import { numberLocaleForLanguage } from '@/lib/i18n/locale'

const AUTO_SAVE_MS = 500

function formatProjectDate(iso: string, lng: string) {
  try {
    return new Intl.DateTimeFormat(numberLocaleForLanguage(lng), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function SavedProjectsMenu() {
  const { t, i18n } = useTranslation()
  const { data, isLoaded: financeLoaded, importFinanceData, startNewDraft } = useFinanceData()
  const {
    projects,
    isLoaded: projectsLoaded,
    activeProjectId,
    setActiveProjectId,
    addProject,
    updateProjectSnapshot,
    removeProject,
  } = useSavedProjects()

  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const projectsRef = useRef(projects)
  projectsRef.current = projects
  const dataRef = useRef(data)
  dataRef.current = data
  const activeIdRef = useRef(activeProjectId)
  activeIdRef.current = activeProjectId

  const ready = financeLoaded && projectsLoaded

  const activeProject = activeProjectId ? projects.find((p) => p.id === activeProjectId) : undefined

  useEffect(() => {
    if (!financeLoaded || !projectsLoaded || !activeProjectId) return

    const timer = window.setTimeout(() => {
      const id = activeIdRef.current
      if (!id) return
      const list = projectsRef.current
      const project = list.find((p) => p.id === id)
      if (!project) {
        setActiveProjectId(null)
        return
      }
      const currentData = dataRef.current
      try {
        if (JSON.stringify(project.data) === JSON.stringify(currentData)) return
      } catch {
        /* compare failed, still save */
      }
      updateProjectSnapshot(id, currentData)
    }, AUTO_SAVE_MS)

    return () => window.clearTimeout(timer)
  }, [data, activeProjectId, financeLoaded, projectsLoaded, setActiveProjectId, updateProjectSnapshot])

  const handleSaveNew = () => {
    const name = newName.trim()
    if (!name) return
    const snapshot = isFinanceDataEmpty(data)
      ? structuredClone(getLocalizedExampleFinanceData(i18n.language))
      : data
    const id = addProject(name, snapshot)
    if (id) setActiveProjectId(id)
    setNewName('')
  }

  const handleLoad = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return
    if (!confirm(t('savedProjects.confirmLoad'))) {
      return
    }
    importFinanceData(project.data)
    setActiveProjectId(project.id)
    setOpen(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(t('savedProjects.confirmDelete', { name }))) return
    removeProject(id)
  }

  const handleNewDraft = () => {
    if (!confirm(t('navigation.confirmNewDraft'))) return
    setActiveProjectId(null)
    startNewDraft()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={!ready}>
          {!ready ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
          {t('navigation.projects')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="border-b border-border px-3 py-2">
          {activeProject ? (
            <p className="text-xs leading-snug text-primary">
              {t('savedProjects.autoSaveActive', { name: activeProject.name })}
            </p>
          ) : (
            <p className="text-xs leading-snug text-muted-foreground">{t('savedProjects.autoSaveDraft')}</p>
          )}
        </div>

        <div className="border-b border-border p-2">
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start gap-2 py-2.5 text-left font-normal"
            disabled={!financeLoaded}
            onClick={handleNewDraft}
            title={t('navigation.newDraftTitle')}
          >
            <FilePlus2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{t('navigation.newDraft')}</span>
          </Button>
        </div>

        <div className="border-b border-border p-3">
          <Label htmlFor="new-project-name" className="text-xs text-muted-foreground">
            {t('savedProjects.newProjectLabel')}
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="new-project-name"
              placeholder={t('savedProjects.placeholderName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNew()
              }}
            />
            <Button type="button" size="icon" variant="secondary" onClick={handleSaveNew} title={t('savedProjects.saveTitle')}>
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{t('savedProjects.savedList')}</p>
        </div>

        {projects.length === 0 ? (
          <p className="px-3 pb-4 text-sm text-muted-foreground">{t('savedProjects.empty')}</p>
        ) : (
          <ScrollArea className="max-h-64">
            <ul className="flex flex-col gap-1 px-2 pb-3">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 rounded-md border border-border bg-secondary/30 p-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-sm">{p.name}</p>
                      {p.id === activeProjectId && (
                        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px] font-normal">
                          {t('savedProjects.activeBadge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('savedProjects.modifiedPrefix')} {formatProjectDate(p.updatedAt, i18n.language)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="default" size="sm" className="h-8 flex-1" onClick={() => handleLoad(p.id)}>
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {t('savedProjects.load')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p.id, p.name)}
                      title={t('savedProjects.deleteTitle')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
