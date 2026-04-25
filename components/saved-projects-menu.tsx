'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { useFinanceData } from '@/hooks/use-finance-data'
import { useSavedProjects } from '@/hooks/use-saved-projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FilePlus2, FolderOpen, Loader2, Lock, Save, Trash2, Upload } from 'lucide-react'
import { isFinanceDataEmpty } from '@/lib/finance-defaults'
import i18n from '@/lib/i18n/i18n'
import { getLocalizedExampleFinanceData } from '@/lib/example-finance-localized'
import { numberLocaleForLanguage } from '@/lib/i18n/locale'
import { uniqueDateBackupProjectName } from '@/lib/unique-date-project-name'

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
  const router = useRouter()
  const { data, isLoaded: financeLoaded, importFinanceData, startNewDraft } = useFinanceData()
  const {
    projects,
    isLoaded: projectsLoaded,
    activeProjectId,
    setActiveProjectId,
    addProject,
    updateProjectSnapshot,
    removeProject,
    persistenceRemote,
    googleAuthConfigured,
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
    if (!persistenceRemote || !financeLoaded || !projectsLoaded || !activeProjectId) return

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
  }, [data, activeProjectId, financeLoaded, projectsLoaded, persistenceRemote, setActiveProjectId, updateProjectSnapshot])

  const handleSaveNew = () => {
    if (!persistenceRemote) return
    const name = newName.trim()
    if (!name) return
    const snapshot = isFinanceDataEmpty(data)
      ? structuredClone(getLocalizedExampleFinanceData(i18n.language))
      : data
    const id = addProject(name, snapshot)
    if (id) setActiveProjectId(id)
    setNewName('')
  }

  /** Écrit tout de suite le brouillon courant dans le projet actif (avant chargement / reset). */
  const flushActiveProjectToStore = () => {
    const id = activeProjectId
    if (!id || !financeLoaded || !projectsLoaded) return
    const current = projects.find((p) => p.id === id)
    if (!current) return
    try {
      if (JSON.stringify(current.data) === JSON.stringify(data)) return
    } catch {
      /* comparer a échoué, on sauvegarde quand même */
    }
    updateProjectSnapshot(id, data)
  }

  /**
   * Brouillon sans projet lié : enregistrer une copie nommée (date du jour, suffixe -2, -3… si besoin)
   * avant de charger un autre projet ou de réinitialiser.
   */
  const persistOrphanDraftIfNeeded = () => {
    if (!persistenceRemote) return
    if (activeProjectId != null) return
    if (!financeLoaded || !projectsLoaded) return
    if (isFinanceDataEmpty(data)) return
    const name = uniqueDateBackupProjectName(projects)
    addProject(name, data)
  }

  const handleLoad = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project) return
    persistOrphanDraftIfNeeded()
    flushActiveProjectToStore()
    if (id === activeProjectId) {
      router.push('/simulateur/donnees')
      setOpen(false)
      return
    }
    importFinanceData(project.data)
    setActiveProjectId(project.id)
    router.push('/simulateur/donnees')
    setOpen(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(t('savedProjects.confirmDelete', { name }))) return
    removeProject(id)
  }

  const handleNewDraft = () => {
    persistOrphanDraftIfNeeded()
    flushActiveProjectToStore()
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
      <PopoverContent
        align="end"
        collisionPadding={12}
        className="flex max-h-[min(85dvh,28rem)] min-h-0 w-[min(100vw-2rem,22rem)] flex-col overflow-hidden p-0"
      >
        {!googleAuthConfigured ? (
          <div className="shrink-0 border-b border-border p-3">
            <Alert className="border-muted-foreground/30 bg-muted/40">
              <AlertDescription className="text-xs leading-relaxed">{t('savedProjects.oauthNotConfigured')}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {!persistenceRemote && googleAuthConfigured ? (
          <div className="shrink-0 border-b border-border p-3">
            <Alert className="border-primary/25 bg-primary/5">
              <Lock className="size-4 text-primary" aria-hidden />
              <AlertDescription className="flex flex-col gap-2 text-xs leading-relaxed">
                <span>{t('savedProjects.loginToSaveHint')}</span>
                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => void signIn('google', { callbackUrl: '/simulateur/donnees' })}
                >
                  {t('auth.signInGoogle')}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="shrink-0 border-b border-border px-3 py-2">
          {activeProject && persistenceRemote ? (
            <p className="text-xs leading-snug text-primary">
              {t('savedProjects.autoSaveActive', { name: activeProject.name })}
            </p>
          ) : (
            <p className="text-xs leading-snug text-muted-foreground">
              {persistenceRemote ? t('savedProjects.autoSaveDraft') : t('savedProjects.draftSessionOnly')}
            </p>
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

        <div className="shrink-0 border-b border-border p-3">
          <Label htmlFor="new-project-name" className="text-xs text-muted-foreground">
            {t('savedProjects.newProjectLabel')}
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="new-project-name"
              placeholder={t('savedProjects.placeholderName')}
              value={newName}
              disabled={!persistenceRemote}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNew()
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              disabled={!persistenceRemote}
              onClick={handleSaveNew}
              title={t('savedProjects.saveTitle')}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="shrink-0 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{t('savedProjects.savedList')}</p>
        </div>

        {projects.length === 0 ? (
          <p className="shrink-0 px-3 pb-4 text-sm text-muted-foreground">{t('savedProjects.empty')}</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 pb-3">
            <ul className="flex flex-col gap-1">
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
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-8 flex-1"
                      disabled={!persistenceRemote}
                      onClick={() => handleLoad(p.id)}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {t('savedProjects.load')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      disabled={!persistenceRemote}
                      onClick={() => handleDelete(p.id, p.name)}
                      title={t('savedProjects.deleteTitle')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
