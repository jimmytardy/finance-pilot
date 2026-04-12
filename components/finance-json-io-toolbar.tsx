'use client'

import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, Upload } from 'lucide-react'
import { useFinanceData } from '@/hooks/use-finance-data'
import { Button } from '@/components/ui/button'
import { downloadFinanceDataJson, parseFinanceDataJson } from '@/lib/finance-json-io'

export function FinanceJsonIoToolbar() {
  const { t } = useTranslation()
  const { data, isLoaded, importFinanceData } = useFinanceData()
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    if (!isLoaded) return
    downloadFinanceDataJson(data)
    toast.success(t('dataJson.exportDone'))
  }

  const handlePickFile = () => {
    fileRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    let text: string
    try {
      text = await file.text()
    } catch {
      toast.error(t('dataJson.error.read_failed'))
      return
    }

    const result = parseFinanceDataJson(text)
    if (!result.ok) {
      toast.error(t(`dataJson.error.${result.error}`))
      return
    }

    if (!window.confirm(t('dataJson.confirmImport'))) {
      return
    }

    importFinanceData(result.data)
    toast.success(t('dataJson.importDone'))
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label={t('dataJson.import')}
        onChange={handleFileChange}
      />
      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!isLoaded} onClick={handleExport}>
        <Download className="h-4 w-4 shrink-0" />
        {t('dataJson.export')}
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!isLoaded} onClick={handlePickFile}>
        <Upload className="h-4 w-4 shrink-0" />
        {t('dataJson.import')}
      </Button>
    </div>
  )
}
